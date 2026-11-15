export function isBlobStorageConfigured(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

export function shouldUseBlobStorage(): boolean {
  if (isBlobStorageConfigured()) return true;

  const isVercelDeployment =
    process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);

  if (isVercelDeployment) {
    throw new Error(
      "Penyimpanan CMS belum terhubung. Hubungkan Vercel Blob ke project ini agar perubahan tidak hilang.",
    );
  }

  return false;
}
