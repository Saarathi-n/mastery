
import path from 'path';
import { fileURLToPath } from 'url';
import { NCERT_BIOLOGY_11_CHAPTERS, SUBJECT_FOLDER_MAP, SECTION_FOLDERS, CLOUDINARY_LIBRARY_ROOT } from '../config/constants.js';
import cloudinary, { splitCloudinaryFolder, searchCloudinaryRawResources, resourceFolder, resourceName, resourceDownloadUrl } from './cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function normalizeClassFolder(classLevel) {
  const match = String(classLevel || "").match(/\d+/);
  if (!match) return "";
  return `${match[0]}th`;
}

export function resolveSubjectFolder(classLevel, subject) {
  const normalizedClass = normalizeClassFolder(classLevel);
  const mappedSubject = SUBJECT_FOLDER_MAP[subject] || subject;
  if (!normalizedClass || !mappedSubject) return null;
  return path.join(__dirname, "..", "ncert ooks", `${normalizedClass} ${mappedSubject}`);
}

export function resolveCloudinarySubjectPrefix(classLevel, subject) {
  const normalizedClass = normalizeClassFolder(classLevel);
  const mappedSubject = SUBJECT_FOLDER_MAP[subject] || subject;
  if (!normalizedClass || !mappedSubject) return null;
  return `${CLOUDINARY_LIBRARY_ROOT}/${normalizedClass} ${mappedSubject}`;
}

export function extractChapterFromFilename(fileName) {
  const baseName = path.parse(fileName).name.toLowerCase();
  const match = baseName.match(/(\d{2})$/);
  return match ? match[1] : null;
}

export function getVirtualChapterName(chapterNum, subject) {
  if (subject && subject.toLowerCase() === 'biology') {
    return NCERT_BIOLOGY_11_CHAPTERS[chapterNum] || `Chapter ${chapterNum}`;
  }
  return `Chapter ${chapterNum}`;
}

export function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isPathInside(rootPath, targetPath) {
  const relative = path.relative(rootPath, targetPath);
  return !!relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function resourceMatchesFile(resource, fileName) {
  const target = String(fileName || "").toLowerCase();
  const candidates = [
    resourceName(resource),
    resource.public_id,
    path.parse(resourceName(resource)).name
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  return candidates.includes(target) || candidates.includes(path.parse(target).name);
}

export function chapterMatchesResource(resource, chapter, subject) {
  const haystack = normalizeSearchText(`${resource.public_id} ${resourceName(resource)}`);
  const chapterTerms = normalizeSearchText(chapter).split(/\s+/).filter(Boolean);
  const subjectAliasMap = {
    physics: ["physics", "phy"],
    chemistry: ["chemistry", "chem"],
    mathematics: ["mathematics", "maths", "math"],
    math: ["math", "maths"],
    biology: ["biology", "bio"]
  };

  const subjectKey = normalizeSearchText(subject).replace(/\s+/g, "");
  const subjectTerms = subjectAliasMap[subjectKey] || normalizeSearchText(subject).split(/\s+/).filter(Boolean);

  const chapterMatch = chapterTerms.some((term) => term.length > 2 && haystack.includes(term));
  const subjectMatch = subjectTerms.length === 0 || subjectTerms.some((term) => haystack.includes(term));
  return chapterMatch && subjectMatch;
}

