const resolvers = {
  cloudflare: {
    label: "Cloudflare (1.1.1.1)",
    url: "https://cloudflare-dns.com/dns-query",
  },
  google: {
    label: "Google (8.8.8.8)",
    url: "https://dns.google/resolve",
  },
  quad9: {
    label: "Quad9 (9.9.9.9)",
    url: "https://dns.quad9.net/dns-query",
  },
};

const form = document.querySelector("#dns-form");
const status = document.querySelector("#status");
const body = document.querySelector("#results-body");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  const domain = String(data.get("domain") || "").trim();
  const recordType = String(data.get("recordType") || "A");
  const chosenResolvers = data.getAll("resolver");

  if (!domain || chosenResolvers.length === 0) {
    status.textContent = "Choose a domain and at least one resolver.";
    return;
  }

  body.innerHTML = "";
  status.textContent = `Running ${recordType} checks for ${domain}...`;

  const checks = chosenResolvers.map((name) => runQuery(name, domain, recordType));
  const results = await Promise.all(checks);

  for (const result of results) {
    const row = document.createElement("tr");
    const answers = result.answers.length
      ? result.answers.map((value) => `<code>${escapeHtml(value)}</code>`).join("")
      : "<em>No answers</em>";

    row.innerHTML = `
      <td>${result.label}</td>
      <td><span class="badge ${result.ok ? "ok" : "err"}">${result.ok ? "OK" : "Error"}</span></td>
      <td>${result.latencyMs ? `${result.latencyMs} ms` : "-"}</td>
      <td>${answers}${result.error ? `<code>${escapeHtml(result.error)}</code>` : ""}</td>
    `;

    body.appendChild(row);
  }

  const successful = results.filter((r) => r.ok).length;
  status.textContent = `Completed. ${successful}/${results.length} resolvers responded successfully.`;
});

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function runQuery(name, domain, type) {
  const resolver = resolvers[name];
  const startedAt = performance.now();

  try {
    const url = new URL(resolver.url);
    url.searchParams.set("name", domain);
    url.searchParams.set("type", type);

    const response = await fetch(url, {
      headers: { Accept: "application/dns-json" },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();
    const answers = (json.Answer || []).map((answer) => answer.data);

    return {
      label: resolver.label,
      ok: true,
      latencyMs: Math.round(performance.now() - startedAt),
      answers,
      error: "",
    };
  } catch (error) {
    return {
      label: resolver.label,
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      answers: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
