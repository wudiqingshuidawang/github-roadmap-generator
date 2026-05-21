export async function copyShareLink(shareToken: string): Promise<boolean> {
  const url = `${window.location.origin}/roadmap/${shareToken}`;
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    const textArea = document.createElement("textarea");
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    return true;
  }
}
