
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import config from '../config/index.js';

if (config.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export function splitCloudinaryFolder(folder) {
  return String(folder || "")
    .split("/")
    .filter(Boolean);
}

export function escapeCloudinaryFolderSegment(segment) {
  return String(segment || "").replace(/ /g, "\\ ");
}

export function escapeCloudinaryFolderPath(folderPath) {
  return splitCloudinaryFolder(folderPath).map(escapeCloudinaryFolderSegment).join("/");
}

export function resourceFolder(resource) {
  if (resource?.folder) return resource.folder;
  if (resource?.public_id) return path.posix.dirname(resource.public_id);
  return "";
}

export async function searchCloudinaryRawResources(folderPrefix) {
  const resources = [];
  let nextCursor = null;
  const folderExp = escapeCloudinaryFolderPath(folderPrefix);
  const expression = `folder:${folderExp}`;

  do {
    let builder = cloudinary.search.expression(expression).max_results(500);
    if (nextCursor) builder = builder.next_cursor(nextCursor);
    const result = await builder.execute();
    resources.push(...(result.resources || []));
    nextCursor = result.next_cursor;
  } while (nextCursor);

  return resources;
}

export function resourceName(resource) {
  return resource?.display_name || resource?.filename || path.posix.basename(resource?.public_id || "") || resource?.public_id || "";
}

export function resourceDownloadUrl(resource) {
  return cloudinary.utils.private_download_url(
    resource.public_id, 
    resource.format || "bin", 
    { resource_type: "raw", type: "upload" }
  );
}

export default cloudinary;

