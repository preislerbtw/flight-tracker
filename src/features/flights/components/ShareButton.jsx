import { useState } from 'react';

export function ShareButton({ getShareLink }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const link = getShareLink();
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleShare} className="share-btn">
      {copied ? '✓ Link copiado!' : '🔗 Compartilhar voo'}
    </button>
  );
}