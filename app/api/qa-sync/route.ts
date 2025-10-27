import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const QA_REPO = process.env.QA_REPO || "01dashmike/Parent-Helper-5";
const GH_TOKEN = process.env.GITHUB_TOKEN;
const QA_PATH = path.join(process.cwd(), "public/qa");

export async function GET() {
  if (!GH_TOKEN) {
    return NextResponse.json({ error: "Missing GITHUB_TOKEN" }, { status: 500 });
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${QA_REPO}/actions/artifacts`, {
      headers: { Authorization: `Bearer ${GH_TOKEN}` },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `GitHub API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const artifact = data?.artifacts?.find((a: any) => a.name === "qa-reports");

    if (!artifact) {
      return NextResponse.json({ status: "no-artifact" });
    }

    const zipRes = await fetch(artifact.archive_download_url, {
      headers: { Authorization: `Bearer ${GH_TOKEN}` },
    });

    if (!zipRes.ok) {
      return NextResponse.json({ error: `Artifact download failed: ${zipRes.status}` }, { status: zipRes.status });
    }

    const buffer = Buffer.from(await zipRes.arrayBuffer());
    const AdmZip = (await import("adm-zip")).default;
    const zip = new AdmZip(buffer);

    fs.mkdirSync(QA_PATH, { recursive: true });
    zip.extractAllTo(QA_PATH, true);

    return NextResponse.json({ status: "ok", files: zip.getEntries().map((e) => e.entryName) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
