import "dotenv/config";

import { createServer } from "@modelcontextprotocol/sdk/server";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";

import pkg from "pg";

import fs from "fs";

import path from "path";

import { fileURLToPath } from "url";

const { Pool } = pkg;

// —– Setup paths for logging —–

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const logDir = path.join(__dirname, "logs");

const logFile = path.join(logDir, "mcp.log");

if (!fs.existsSync(logDir)) {

fs.mkdirSync(logDir, { recursive: true });

}

// —– Environment variables —–

const databaseUrl = process.env.DATABASE_URL;

const adminToken = process.env.ADMIN_TOKEN || "";

const writableTablesEnv = process.env.ADMIN_WRITABLE_TABLES || "";

if (!databaseUrl) {

console.error("DATABASE_URL is not set in environment or .env file.");

process.exit(1);

}

const writableTables = writableTablesEnv

.split(",")

.map((t) => t.trim())

.filter((t) => t.length > 0);

// —– Postgres connection —–

const pool = new Pool({

connectionString: databaseUrl,

});

// —– Simple logging helper —–

function logAction(type, message, data = null) {

const entry = {

timestamp: new Date().toISOString(),

type,

message,

data,

};

const line = JSON.stringify(entry) + "\n";

fs.appendFile(logFile, line, (err) => {

if (err) {

console.error("Failed to write log entry", err);

}

});

}

// —– Helper: fetch list of user tables —–

async function getUserTables() {

const client = await pool.connect();

try {

const result = await client.query(

`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`

);

return result.rows.map((r) => r.table_name);

} finally {

client.release();

}

}

// —– Helper: validate table name —–

async function validateTableName(tableName) {

if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {

throw new Error("Invalid table name format");

}

const tables = await getUserTables();

if (!tables.includes(tableName)) {

throw new Error("Table not found or not allowed");

}

}

// —– Helper: get columns for a table —–

async function getTableColumns(tableName) {

await validateTableName(tableName);

const client = await pool.connect();

try {

const result = await client.query(

`SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position`,

[tableName]

);

return result.rows;

} finally {

client.release();

}

}

// —– Helper: check admin and writable table —–

async function requireAdminForWrite(input, tableName) {

if (!adminToken) {

throw new Error(

"ADMIN_TOKEN is not configured on the server. Writes are disabled."

);

}

if (!input || input.adminToken !== adminToken) {

throw new Error("Invalid or missing admin token");

}

await validateTableName(tableName);

if (writableTables.length > 0 && !writableTables.includes(tableName)) {

throw new Error("Writes are not allowed for this table");

}

}

// —– Create MCP server —–

const server = createServer(

{

name: "supabase-full-mcp",

version: "1.0.0",

},

{

capabilities: {

tools: {},

},

}

);

// =====================

// Schema and metadata tools

// =====================

server.tool(

"list_tables",

{

description: "List all tables in the public schema.",

inputSchema: {

type: "object",

properties: {},

},

},

async () => {

const tables = await getUserTables();

logAction("read", "list_tables", { tablesCount: tables.length });

return {

content: [

{

type: "text",

text: JSON.stringify({ tables }, null, 2),

},

],

};

}

);

server.tool(

"get_table_schema",

{

description: "Get columns and types for a given table.",

inputSchema: {

type: "object",

properties: {

table: {

type: "string",

description: "Table name in the public schema.",

},

},

required: ["table"],

},

},

async (input) => {

const columns = await getTableColumns(input.table);

logAction("read", "get_table_schema", {

table: input.table,

columnsCount: columns.length,

});

return {

content: [

{

type: "text",

text: JSON.stringify(

{ table: input.table, columns },

null,

2

),

},

],

};

}

);

// =====================

// Safe read tools

// =====================

server.tool(

"read_table",

{

description:

"Read rows from a table with optional limit and offset. Returns all columns.",

inputSchema: {

type: "object",

properties: {

table: {

type: "string",

description: "Table name in the public schema.",

},

limit: {

type: "number",

description: "Maximum number of rows to return (default 50, max 500).",

},

offset: {

type: "number",

description: "Offset for pagination (default 0).",

},

},

required: ["table"],

},

},

async (input) => {

const table = input.table;

await validateTableName(table);

let limit = typeof input.limit === "number" ? input.limit : 50;



let offset = typeof input.offset === "number" ? input.offset : 0;

if (limit <= 0 || limit > 500) limit = 50;

if (offset < 0) offset = 0;

const client = await pool.connect();

try {

  const sql = `SELECT * FROM "${table}" ORDER BY 1 LIMIT $1 OFFSET $2`;

  const result = await client.query(sql, [limit, offset]);

  logAction("read", "read_table", {

    table,

    limit,

    offset,

    rows: result.rowCount,

  });

  return {

    content: [

      {

        type: "text",

        text: JSON.stringify(

          {

            table,

            limit,

            offset,

            rows: result.rows,

          },

          null,

          2

        ),

      },

    ],

  };

} finally {

  client.release();

}

}



);

server.tool(

"read_table_where_equals",

{

description:

"Read rows from a table where a given column equals a value. Uses strict, parameterized equality.",

inputSchema: {

type: "object",

properties: {

table: {

type: "string",

description: "Table name in the public schema.",

},

column: {

type: "string",

description: "Column name to filter on.",

},

value: {

description: "Value to match exactly.",

},

limit: {

type: "number",

description: "Maximum number of rows to return (default 50, max 500).",

},

},

required: ["table", "column", "value"],

},

},

async (input) => {

const table = input.table;

const column = input.column;

await validateTableName(table);

const columns = await getTableColumns(table);



const columnNames = columns.map((c) => c.column_name);

if (!columnNames.includes(column)) {

  throw new Error("Column not found on this table");

}

let limit = typeof input.limit === "number" ? input.limit : 50;

if (limit <= 0 || limit > 500) limit = 50;

const client = await pool.connect();

try {

  const sql = `SELECT * FROM "${table}" WHERE "${column}" = $1 LIMIT $2`;

  const result = await client.query(sql, [input.value, limit]);

  logAction("read", "read_table_where_equals", {

    table,

    column,

    limit,

    rows: result.rowCount,

  });

  return {

    content: [

      {

        type: "text",

        text: JSON.stringify(

          {

            table,

            column,

            value: input.value,

            limit,

            rows: result.rows,

          },

          null,

          2

        ),

      },

    ],

  };

} finally {

  client.release();

}

}



);

// =====================

// Admin-only write tools

// =====================

server.tool(

"admin_insert_row",

{

description:

"Admin-only: insert a row into a writable table. Requires adminToken and a JSON object of column values.",

inputSchema: {

type: "object",

properties: {

adminToken: {

type: "string",

description: "Admin token for authorization.",

},

table: {

type: "string",

description: "Writable table name.",

},

values: {

type: "object",

description:

"Key/value pairs where keys are column names and values are the values to insert.",

},

},

required: ["adminToken", "table", "values"],

},

},

async (input) => {

const table = input.table;

await requireAdminForWrite(input, table);

if (



  !input.values ||

  typeof input.values !== "object" ||

  Array.isArray(input.values)

) {

  throw new Error("values must be an object");

}

const columnsMeta = await getTableColumns(table);

const allowedColumns = columnsMeta.map((c) => c.column_name);

const entries = Object.entries(input.values).filter(([key]) =>

  allowedColumns.includes(key)

);

if (entries.length === 0) {

  throw new Error("No valid columns provided for insert");

}

const columnNames = entries.map(([key]) => key);

const paramValues = entries.map(([, value]) => value);

const placeholders = entries.map((_, idx) => `$${idx + 1}`);

const sql = `INSERT INTO "${table}" (${columnNames

  .map((c) => `"${c}"`)

  .join(", ")}) VALUES (${placeholders.join(

  ", "

)}) RETURNING *`;

const client = await pool.connect();

try {

  const result = await client.query(sql, paramValues);

  logAction("write", "admin_insert_row", {

    table,

    columns: columnNames,

    rowsInserted: result.rowCount,

  });

  return {

    content: [

      {

        type: "text",

        text: JSON.stringify(

          {

            table,

            inserted: result.rows[0],

          },

          null,

          2

        ),

      },

    ],

  };

} finally {

  client.release();

}

}



);

server.tool(

"admin_update_row_by_id",

{

description:

"Admin-only: update a single row identified by an ID column. Requires adminToken.",

inputSchema: {

type: "object",

properties: {

adminToken: {

type: "string",

description: "Admin token for authorization.",

},

table: {

type: "string",

description: "Writable table name.",

},

idColumn: {

type: "string",

description: "Name of the ID column (e.g. id).",

},

idValue: {

description: "Value of the ID to match.",

},

values: {

type: "object",

description:

"Key/value pairs of columns to update. Only valid columns will be used.",

},

},

required: ["adminToken", "table", "idColumn", "idValue", "values"],

},

},

async (input) => {

const table = input.table;

await requireAdminForWrite(input, table);

if (



  !input.values ||

  typeof input.values !== "object" ||

  Array.isArray(input.values)

) {

  throw new Error("values must be an object");

}

const columnsMeta = await getTableColumns(table);

const allowedColumns = columnsMeta.map((c) => c.column_name);

if (!allowedColumns.includes(input.idColumn)) {

  throw new Error("ID column not found on this table");

}

const entries = Object.entries(input.values).filter(([key]) =>

  allowedColumns.includes(key)

);

if (entries.length === 0) {

  throw new Error("No valid columns provided for update");

}

const setClauses = entries.map(

  ([key], idx) => `"${key}" = $${idx + 1}`

);

const paramValues = entries.map(([, value]) => value);

const idParamIndex = entries.length + 1;

const sql = `UPDATE "${table}" SET ${setClauses.join(

  ", "

)} WHERE "${input.idColumn}" = $${idParamIndex} RETURNING *`;

paramValues.push(input.idValue);

const client = await pool.connect();

try {

  const result = await client.query(sql, paramValues);

  logAction("write", "admin_update_row_by_id", {

    table,

    idColumn: input.idColumn,

    rowsUpdated: result.rowCount,

  });

  return {

    content: [

      {

        type: "text",

        text: JSON.stringify(

          {

            table,

            updatedRows: result.rows,

          },

          null,

          2

        ),

      },

    ],

  };

} finally {

  client.release();

}

}



);

server.tool(

"admin_delete_row_by_id",

{

description:

"Admin-only: delete a single row identified by an ID column. Requires adminToken.",

inputSchema: {

type: "object",

properties: {

adminToken: {

type: "string",

description: "Admin token for authorization.",

},

table: {

type: "string",

description: "Writable table name.",

},

idColumn: {

type: "string",

description: "Name of the ID column (e.g. id).",

},

idValue: {

description: "Value of the ID to match.",

},

},

required: ["adminToken", "table", "idColumn", "idValue"],

},

},

async (input) => {

const table = input.table;

await requireAdminForWrite(input, table);

const columnsMeta = await getTableColumns(table);



const allowedColumns = columnsMeta.map((c) => c.column_name);

if (!allowedColumns.includes(input.idColumn)) {

  throw new Error("ID column not found on this table");

}

const sql = `DELETE FROM "${table}" WHERE "${input.idColumn}" = $1 RETURNING *`;

const client = await pool.connect();

try {

  const result = await client.query(sql, [input.idValue]);

  logAction("write", "admin_delete_row_by_id", {

    table,

    idColumn: input.idColumn,

    rowsDeleted: result.rowCount,

  });

  return {

    content: [

      {

        type: "text",

        text: JSON.stringify(

          {

            table,

            deletedRows: result.rows,

          },

          null,

          2

        ),

      },

    ],

  };

} finally {

  client.release();

}

}

);



// —– Start MCP server over stdio —–

const transport = new StdioServerTransport();

server.connect(transport);
