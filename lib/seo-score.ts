/**
 * SEO Score Calculator for Blog Posts
 * Provides a score from 0-100 based on various SEO factors
 */

export interface SEOCheckResult {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
}

export interface SEOScoreResult {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  checks: SEOCheckResult[];
}

export function calculateSEOScore(data: {
  title?: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
  heroImage?: string;
  bodyMarkdown?: string;
}): SEOScoreResult {
  const checks: SEOCheckResult[] = [];

  // 1. SEO Title check (15 points)
  const seoTitle = data.seoTitle || data.title || "";
  const seoTitleLength = seoTitle.length;
  if (seoTitleLength >= 50 && seoTitleLength <= 60) {
    checks.push({
      name: "SEO Title Length",
      passed: true,
      score: 15,
      maxScore: 15,
      message: `Perfect length (${seoTitleLength} chars)`,
    });
  } else if (seoTitleLength >= 40 && seoTitleLength <= 70) {
    checks.push({
      name: "SEO Title Length",
      passed: true,
      score: 10,
      maxScore: 15,
      message: `Good length (${seoTitleLength} chars), ideal is 50-60`,
    });
  } else if (seoTitleLength > 0) {
    checks.push({
      name: "SEO Title Length",
      passed: false,
      score: 5,
      maxScore: 15,
      message: seoTitleLength < 40 ? `Too short (${seoTitleLength} chars)` : `Too long (${seoTitleLength} chars)`,
    });
  } else {
    checks.push({
      name: "SEO Title Length",
      passed: false,
      score: 0,
      maxScore: 15,
      message: "Missing SEO title",
    });
  }

  // 2. Meta Description check (15 points)
  const metaDesc = data.seoDescription || data.excerpt || "";
  const metaDescLength = metaDesc.length;
  if (metaDescLength >= 150 && metaDescLength <= 160) {
    checks.push({
      name: "Meta Description",
      passed: true,
      score: 15,
      maxScore: 15,
      message: `Perfect length (${metaDescLength} chars)`,
    });
  } else if (metaDescLength >= 120 && metaDescLength <= 180) {
    checks.push({
      name: "Meta Description",
      passed: true,
      score: 10,
      maxScore: 15,
      message: `Good length (${metaDescLength} chars), ideal is 150-160`,
    });
  } else if (metaDescLength > 0) {
    checks.push({
      name: "Meta Description",
      passed: false,
      score: 5,
      maxScore: 15,
      message: metaDescLength < 120 ? `Too short (${metaDescLength} chars)` : `Too long (${metaDescLength} chars)`,
    });
  } else {
    checks.push({
      name: "Meta Description",
      passed: false,
      score: 0,
      maxScore: 15,
      message: "Missing meta description",
    });
  }

  // 3. Hero Image check (10 points)
  const hasHeroImage = Boolean(data.heroImage?.trim());
  checks.push({
    name: "Hero Image",
    passed: hasHeroImage,
    score: hasHeroImage ? 10 : 0,
    maxScore: 10,
    message: hasHeroImage ? "Has hero image" : "Missing hero image",
  });

  // 4. Content Length check (15 points)
  const content = data.bodyMarkdown || "";
  const wordCount = content
    .replace(/[#*_`>\-\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean).length;

  if (wordCount >= 1200) {
    checks.push({
      name: "Content Length",
      passed: true,
      score: 15,
      maxScore: 15,
      message: `Excellent (${wordCount} words)`,
    });
  } else if (wordCount >= 800) {
    checks.push({
      name: "Content Length",
      passed: true,
      score: 10,
      maxScore: 15,
      message: `Good (${wordCount} words), aim for 1200+`,
    });
  } else if (wordCount >= 300) {
    checks.push({
      name: "Content Length",
      passed: false,
      score: 5,
      maxScore: 15,
      message: `Short (${wordCount} words), aim for 800+`,
    });
  } else {
    checks.push({
      name: "Content Length",
      passed: false,
      score: 0,
      maxScore: 15,
      message: `Very short (${wordCount} words)`,
    });
  }

  // 5. Headings check (10 points)
  const h2Count = (content.match(/^##\s/gm) || []).length;
  const h3Count = (content.match(/^###\s/gm) || []).length;
  const hasHeadings = h2Count >= 2;
  checks.push({
    name: "Heading Structure",
    passed: hasHeadings,
    score: hasHeadings ? 10 : h2Count >= 1 ? 5 : 0,
    maxScore: 10,
    message: hasHeadings
      ? `Good structure (${h2Count} H2s, ${h3Count} H3s)`
      : h2Count >= 1
        ? `Needs more headings (${h2Count} H2s)`
        : "Missing headings",
  });

  // 6. Internal Links check (10 points)
  const internalLinkCount = (content.match(/\[link:[^\]]+\]/g) || []).length;
  const hasInternalLinks = internalLinkCount >= 2;
  checks.push({
    name: "Internal Links",
    passed: hasInternalLinks,
    score: hasInternalLinks ? 10 : internalLinkCount >= 1 ? 5 : 0,
    maxScore: 10,
    message: hasInternalLinks
      ? `Good (${internalLinkCount} internal links)`
      : internalLinkCount >= 1
        ? `Add more internal links (${internalLinkCount} found)`
        : "Missing internal links",
  });

  // 7. Images in content check (10 points)
  const imageCount = (content.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const hasContentImages = imageCount >= 1;
  checks.push({
    name: "Content Images",
    passed: hasContentImages,
    score: hasContentImages ? 10 : 0,
    maxScore: 10,
    message: hasContentImages
      ? `Has ${imageCount} image${imageCount > 1 ? "s" : ""} in content`
      : "No images in content",
  });

  // 8. Lists check (5 points)
  const bulletListCount = (content.match(/^[-*]\s/gm) || []).length;
  const numberedListCount = (content.match(/^\d+\.\s/gm) || []).length;
  const hasLists = bulletListCount >= 3 || numberedListCount >= 3;
  checks.push({
    name: "List Formatting",
    passed: hasLists,
    score: hasLists ? 5 : bulletListCount + numberedListCount > 0 ? 2 : 0,
    maxScore: 5,
    message: hasLists
      ? `Good use of lists`
      : bulletListCount + numberedListCount > 0
        ? "Add more list items"
        : "Consider adding bullet points",
  });

  // 9. Readability - Short paragraphs (5 points)
  const paragraphs = content.split(/\n\n+/).filter((p) => p.trim() && !p.startsWith("#") && !p.startsWith("-") && !p.startsWith("*"));
  const avgParagraphLength =
    paragraphs.length > 0
      ? paragraphs.reduce((sum, p) => sum + p.split(/\s+/).length, 0) / paragraphs.length
      : 0;
  const hasShortParagraphs = avgParagraphLength <= 80;
  checks.push({
    name: "Paragraph Length",
    passed: hasShortParagraphs,
    score: hasShortParagraphs ? 5 : avgParagraphLength <= 120 ? 3 : 0,
    maxScore: 5,
    message: hasShortParagraphs
      ? "Good paragraph length"
      : `Paragraphs may be too long (avg ${Math.round(avgParagraphLength)} words)`,
  });

  // 10. Has excerpt/summary (5 points - bonus)
  const hasExcerpt = Boolean(data.excerpt?.trim());
  checks.push({
    name: "Excerpt",
    passed: hasExcerpt,
    score: hasExcerpt ? 5 : 0,
    maxScore: 5,
    message: hasExcerpt ? "Has excerpt" : "Missing excerpt",
  });

  // Calculate total score
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
  const maxPossibleScore = checks.reduce((sum, check) => sum + check.maxScore, 0);
  const normalizedScore = Math.round((totalScore / maxPossibleScore) * 100);

  // Determine grade
  let grade: "A" | "B" | "C" | "D" | "F";
  if (normalizedScore >= 90) grade = "A";
  else if (normalizedScore >= 80) grade = "B";
  else if (normalizedScore >= 70) grade = "C";
  else if (normalizedScore >= 60) grade = "D";
  else grade = "F";

  return {
    score: normalizedScore,
    grade,
    checks,
  };
}



