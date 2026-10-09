import {
  ShieldIcon,
  SparklesIcon,
  CheckIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  LeafIcon,
} from './Icons.jsx';

export function WhyLocalAi({ health, onRefreshHealth, isRefreshing }) {
  const isCloudflare = health?.provider === 'cloudflare-workers-ai';

  return (
    <div className="why-local-ai-view">
      <div className="view-header">
        <span className="view-badge">
          <ShieldIcon size={16} /> Architecture & Privacy Modes
        </span>
        <h2 className="view-title">Open-Weight AI & Privacy Architecture</h2>
        <p className="view-subtitle">
          An honest, transparent look at how FieldNote pairs open-weight language models with privacy in both Local and Cloudflare modes.
        </p>
      </div>

      {/* Two Architecture Modes Comparison */}
      <div className="why-ai-grid">
        <div className="why-card">
          <div className="why-icon-wrap">
            <LeafIcon size={24} />
          </div>
          <h3>1. Local Mode (Ollama)</h3>
          <p>
            When running locally with <code>npm run dev</code>, all inference is powered by your local Ollama daemon (<code>127.0.0.1:11434</code>) running <code>qwen2.5:7b</code>. Zero prompt tokens or notes leave your machine. It operates 100% on-device and is completely immune to cloud outages or external rate limits.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-wrap">
            <SparklesIcon size={24} />
          </div>
          <h3>2. Cloud Mode (Cloudflare Workers AI)</h3>
          <p>
            When deployed on Cloudflare Pages, serverless edge functions invoke Cloudflare Workers AI with <code>@cf/meta/llama-3.2-3b-instruct</code>. Prompts are transmitted securely over HTTPS to Cloudflare's global edge network. Your journal entries still reside exclusively in your browser's local storage.
          </p>
        </div>

        <div className="why-card">
          <div className="why-icon-wrap">
            <ShieldIcon size={24} />
          </div>
          <h3>3. Zero Centralized Tracking</h3>
          <p>
            Unlike typical commercial AI apps, FieldNote has no user database, no telemetry, and no ad trackers. We never store your locations or personal thoughts on a remote server. Whether in local or edge mode, the data ownership stays in your hands.
          </p>
        </div>
      </div>

      {/* Realistic Technical Assessment */}
      <section className="tech-reality-box">
        <div className="reality-header">
          <AlertCircleIcon size={20} className="text-terracotta" />
          <h3>Honest Technical Considerations & Quotas</h3>
        </div>
        <p>
          We believe in honest engineering over AI marketing hype:
        </p>
        <ul className="reality-list">
          <li>
            <strong>Cloudflare Free Tier Quotas:</strong> Cloudflare Workers AI offers a daily allowance of free Neurons. Because inference is not unlimited, heavy usage may hit daily allowances, returning an HTTP 429 response. FieldNote handles this cleanly without silently fabricating fake AI responses.
          </li>
          <li>
            <strong>Data Transmission Difference:</strong> In Local mode, data stays 100% on-device. In Cloud mode, prompts are sent to Cloudflare's serverless edge for inference, but the resulting entries are saved only into your browser's localStorage.
          </li>
          <li>
            <strong>Local Hardware Requirements:</strong> When running Ollama locally, <code>qwen2.5:7b</code> requires ~4.7 GB of RAM/VRAM. Dedicated GPUs complete requests in seconds, while older CPU-only machines may take 20–40 seconds.
          </li>
          <li>
            <strong>Naturalist Integrity:</strong> Open-weight models are thoughtful companions, not definitive taxonomists. FieldNote prompts explicitly instruct the AI never to state unconfirmed species guesses as absolute facts and strictly forbid touching or consuming wild plants or fungi.
          </li>
        </ul>
      </section>

      {/* Live System Diagnostics Box */}
      <section className="live-diagnostics-card">
        <div className="diag-header-row">
          <div>
            <h3>Current Environment Status</h3>
            <p>
              {isCloudflare
                ? 'Inspecting active Cloudflare Pages edge deployment'
                : "Direct inspection of your local machine's Ollama runtime"}
            </p>
          </div>
          <button
            className="btn btn-sm btn-outline"
            onClick={onRefreshHealth}
            disabled={isRefreshing}
          >
            <RefreshCwIcon size={14} className={isRefreshing ? 'spin-icon' : ''} />
            {isRefreshing ? 'Checking...' : 'Refresh Status'}
          </button>
        </div>

        <div className="diag-details-list">
          <div className="diag-row">
            <span className="diag-key">Deployment Mode:</span>
            <span className="diag-val font-bold">
              {isCloudflare ? 'Cloudflare Pages (Workers AI)' : 'Localhost (Node.js + Ollama)'}
            </span>
          </div>
          <div className="diag-row">
            <span className="diag-key">Active Model:</span>
            <span className="diag-val font-bold">
              {health?.model || (isCloudflare ? '@cf/meta/llama-3.2-3b-instruct' : 'qwen2.5:7b')}
            </span>
          </div>
          <div className="diag-row">
            <span className="diag-key">AI Provider Status:</span>
            <span className={`diag-val ${health?.ok ? 'text-forest' : 'text-terracotta'}`}>
              {health?.ok
                ? (isCloudflare ? '✓ Workers AI Binding Active' : '✓ Ollama Daemon Online')
                : '✕ Not Configured / Unreachable'}
            </span>
          </div>
          {!isCloudflare && health?.availableModels && health.availableModels.length > 0 && (
            <div className="diag-row">
              <span className="diag-key">Installed Local Models:</span>
              <span className="diag-val">{health.availableModels.join(', ')}</span>
            </div>
          )}
        </div>

        {health?.ok ? (
          <div className="diag-good-status">
            <CheckIcon size={18} />
            <span>
              {isCloudflare
                ? 'Cloudflare Workers AI binding is active. Ready for edge-accelerated nature journaling!'
                : 'Local Ollama model is verified. Ready for private, on-device nature journaling!'}
            </span>
          </div>
        ) : (
          <div className="diag-fix-status">
            <AlertCircleIcon size={18} />
            <div>
              <strong>Action required to enable AI:</strong>
              {isCloudflare ? (
                <>
                  <p>In the Cloudflare Dashboard for your Pages project:</p>
                  <code>
                    1. Go to Settings &gt; Bindings<br />
                    2. Add a Workers AI binding with variable name: AI<br />
                    3. Redeploy the application
                  </code>
                </>
              ) : (
                <>
                  <p>Run these commands in PowerShell or your terminal:</p>
                  <code>
                    ollama serve<br />
                    ollama run qwen2.5:7b
                  </code>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
