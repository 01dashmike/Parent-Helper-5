/**
 * Unit tests for documentation file reading utilities
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  readMarkdownFiles,
  readJSONFile,
  getTodos,
  type TodoItem,
} from "@/lib/docs/readFiles";
import { readFile, readdir, stat } from "fs/promises";
import { existsSync } from "fs";

// Mock fs/promises
vi.mock("fs/promises");
vi.mock("fs");

describe("readFiles utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("readMarkdownFiles", () => {
    it("should return empty array if directory does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await readMarkdownFiles("/nonexistent");

      expect(result).toEqual([]);
    });

    it("should read markdown files from directory", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        {
          name: "test.md",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);
      vi.mocked(readFile).mockResolvedValue("# Test Content");
      vi.mocked(stat).mockResolvedValue({
        mtime: new Date("2024-01-01"),
      } as any);

      const result = await readMarkdownFiles("/test");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test.md");
      expect(result[0].content).toBe("# Test Content");
    });

    it("should skip non-markdown files", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        {
          name: "test.txt",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);

      const result = await readMarkdownFiles("/test");

      expect(result).toEqual([]);
    });

    it("should recursively read subdirectories", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdir)
        .mockResolvedValueOnce([
          {
            name: "subdir",
            isDirectory: () => true,
            isFile: () => false,
          } as any,
        ])
        .mockResolvedValueOnce([
          {
            name: "nested.md",
            isDirectory: () => false,
            isFile: () => true,
          } as any,
        ]);
      vi.mocked(readFile).mockResolvedValue("# Nested Content");
      vi.mocked(stat).mockResolvedValue({
        mtime: new Date("2024-01-01"),
      } as any);

      const result = await readMarkdownFiles("/test");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("nested.md");
    });
  });

  describe("readJSONFile", () => {
    it("should return null if file does not exist", async () => {
      vi.mocked(existsSync).mockReturnValue(false);

      const result = await readJSONFile("/nonexistent.json");

      expect(result).toBeNull();
    });

    it("should parse valid JSON file", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue('{"key": "value"}');

      const result = await readJSONFile("/test.json");

      expect(result).toEqual({ key: "value" });
    });

    it("should return null on invalid JSON", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readFile).mockResolvedValue("invalid json");

      const result = await readJSONFile("/test.json");

      expect(result).toBeNull();
    });
  });

  describe("getTodos", () => {
    it("should extract TODO comments from files", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        {
          name: "test.ts",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);
      vi.mocked(readFile).mockResolvedValue(`
        // TODO: Fix this
        const x = 1;
        // FIXME: This is broken
        // NOTE: Important note here
      `);

      const todos = await getTodos();

      expect(todos.length).toBeGreaterThan(0);
      expect(todos.some((t) => t.type === "TODO")).toBe(true);
      expect(todos.some((t) => t.type === "FIXME")).toBe(true);
      expect(todos.some((t) => t.type === "NOTE")).toBe(true);
    });

    it("should extract priority from TODO comments", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        {
          name: "test.ts",
          isDirectory: () => false,
          isFile: () => true,
        } as any,
      ]);
      vi.mocked(readFile).mockResolvedValue(`
        // TODO: high priority - fix this
        const x = 1;
      `);

      const todos = await getTodos();

      expect(todos.length).toBeGreaterThan(0);
      const highPriorityTodo = todos.find((t) => t.priority === "high");
      expect(highPriorityTodo).toBeDefined();
    });

    it("should exclude node_modules and other directories", async () => {
      vi.mocked(existsSync).mockReturnValue(true);
      vi.mocked(readdir).mockResolvedValue([
        {
          name: "node_modules",
          isDirectory: () => true,
          isFile: () => false,
        } as any,
      ]);

      const todos = await getTodos();

      // Should not read from node_modules
      expect(readFile).not.toHaveBeenCalled();
    });
  });
});

