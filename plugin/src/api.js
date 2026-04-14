export async function submitReport(apiUrl, data) {
  const formData = new FormData();
  formData.append('title', data.title);
  formData.append('notes', data.notes || '');
  formData.append('appName', data.appName);
  formData.append('pageUrl', data.pageUrl);
  formData.append('reportedAt', data.reportedAt);
  
  if (data.videoBlob) {
    formData.append('video', data.videoBlob, 'report.webm');
  }

  const response = await fetch(`${apiUrl}/api/bug-reports`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || 'Failed to upload bug report');
  }

  return await response.json();
}
