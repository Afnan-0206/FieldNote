import { CloseIcon, ShieldIcon, SparklesIcon, CheckIcon, AlertCircleIcon, RefreshCwIcon } from './Icons.jsx';

export function AiStatusModal({ isOpen, onClose, health, onRefreshHealth, isRefreshing }) {
  if (!isOpen) return null;

  const isCloudflare = health?.provider === 'cloudflare-workers-ai';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-icon-badge">
              <SparklesIcon size={20} />
            </span>
            <div>
              <h3 id="modal-title" className="modal-title">AI Diagnostics & Environment</h3>
              <p className="modal-subtitle">
                {isCloudflare
                  ? 'FieldNote on Cloudflare Pages • Workers AI Edge Inference'
                  : 'FieldNote Local Environment • On-Device Ollama Inference'}
              </p>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Status banner */}
          <div className={`status-callout ${health?.ok ? 'status-callout-success' : 'status-callout-warning'}`}>
            <div className="callout-header">
              {health?.ok ? (
                <>
                  <CheckIcon size={20} className="text-forest" />
                  <strong>
                    {isCloudflare ? 'Workers AI Binding Active & Ready' : 'Local AI Active & Ready'}
                  </strong>
                </>
              ) : (
                <>
                  <AlertCircleIcon size={20} className="text-terracotta" />
                  <strong>
                    {isCloudflare ? 'Cloudflare Workers AI Binding Needed' : 'Attention Needed for Local AI'}
                  </strong>
                </>
              )}
            </div>
            <p className="callout-desc">
              {health?.ok
                ? (isCloudflare
                    ? `Cloudflare Pages Function is connected to Workers AI binding with model "${health?.model}".`
                    : `Ollama is running locally and model "${health?.model}" is verified.`)
                : (health?.error || 'Could not verify AI service readiness.')}
            </p>
          </div>

          {/* Details grid */}
          <div className="diagnostic-grid">
            <div className="diagnostic-item">
              <span className="label">Runtime Mode</span>
              <span className="value font-bold">
                {isCloudflare ? 'Cloudflare Pages (Cloud)' : 'Localhost (Node.js)'}
              </span>
            </div>
            <div className="diagnostic-item">
              <span className="label">AI Provider</span>
              <span className="value">
                {isCloudflare ? 'Cloudflare Workers AI' : 'Local Ollama'}
              </span>
            </div>
            <div className="diagnostic-item">
              <span className="label">Active Model</span>
              <span className="value code-val">
                {health?.model || (isCloudflare ? '@cf/meta/llama-3.2-3b-instruct' : 'qwen2.5:7b')}
              </span>
            </div>
            <div className="diagnostic-item">
              <span className="label">Inference Status</span>
              <span className={`value badge-val ${health?.ok ? 'badge-good' : 'badge-bad'}`}>
                {health?.ok ? 'Ready for requests' : 'Configuration required'}
              </span>
            </div>
            {isCloudflare && (
              <div className="diagnostic-item">
                <span className="label">Live Deployment</span>
                <span className="value">
                  <a
                    href="https://1d037bfe.fieldnote-byg.pages.dev/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-doc-link"
                  >
                    1d037bfe.fieldnote-byg.pages.dev ↗
                  </a>
                </span>
              </div>
            )}
          </div>

          {/* Local models list if on Ollama */}
          {!isCloudflare && health?.availableModels && health.availableModels.length > 0 && (
            <div className="available-models-section">
              <span className="label">Installed Local Models ({health.availableModels.length})</span>
              <div className="model-tags-list">
                {health.availableModels.map((m) => (
                  <span
                    key={m}
                    className={`model-tag ${m.includes(health?.model?.split(':')[0] || 'qwen') ? 'model-tag-active' : ''}`}
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Privacy statement - Environment Aware */}
          <div className="privacy-pledge">
            <div className="pledge-header">
              <ShieldIcon size={16} />
              <span>Observation Privacy & Storage Architecture</span>
            </div>
            <p>
              <strong>Journal Storage:</strong> All journal entries, saved observations, and personal notes remain stored strictly inside your browser's <code>localStorage</code>. No observation database is hosted in the cloud.
            </p>
            <p className="mt-1">
              <strong>AI Processing:</strong> {isCloudflare
                ? 'In Cloudflare Pages mode, prompt inputs for mission generation and reflection travel securely over HTTPS to Cloudflare Pages Functions and are processed by Cloudflare Workers AI at the edge. Free Workers AI usage has a daily neuron allowance.'
                : 'In Local mode, AI inference runs 100% on your device through Ollama (127.0.0.1:11434). Zero prompt tokens or notes leave your computer.'}
            </p>
          </div>

          {/* Troubleshooting tips if offline */}
          {!health?.ok && (
            <div className="troubleshoot-box">
              <h4>Setup & Configuration Instructions:</h4>
              {isCloudflare ? (
                <code>
                  1. Open Cloudflare Dashboard &gt; Workers &amp; Pages<br />
                  2. Select your FieldNote Pages project<br />
                  3. Navigate to Settings &gt; Bindings<br />
                  4. Add a Workers AI binding with variable name: AI<br />
                  5. Save and redeploy the project
                </code>
              ) : (
                <code>
                  # Start Ollama service<br />
                  ollama serve<br /><br />
                  # Verify and run the recommended model<br />
                  ollama run qwen2.5:7b
                </code>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-outline"
            onClick={onRefreshHealth}
            disabled={isRefreshing}
          >
            <RefreshCwIcon size={16} className={isRefreshing ? 'spin-icon' : ''} />
            {isRefreshing ? 'Checking...' : 'Re-check Connection'}
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
