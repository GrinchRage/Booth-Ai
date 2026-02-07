const form = document.getElementById("boothForm");
const statusEl = document.getElementById("status");
const gallery = document.getElementById("gallery");
const presetSelect = document.getElementById("presetSelect");
const freePrompt = document.getElementById("freePrompt");
const phoneToggle = document.getElementById("phoneToggle");
const mirrorToggle = document.getElementById("mirrorToggle");
const apiTokenInput = document.getElementById("apiToken");

const PRESET_PROMPTS = {
  "selfie-naturale":
    "Selfie realistico, luce naturale, pelle autentica, composizione casuale.",
  "selfie-amici":
    "Selfie realistico con amici, sorriso spontaneo, ambiente urbano.",
  "selfie-viaggio":
    "Selfie realistico da viaggio, scenario iconico sullo sfondo, luce calda.",
  "selfie-golden-hour":
    "Selfie realistico al tramonto, golden hour, toni morbidi.",
  "selfie-specchio":
    "Selfie realistico allo specchio, bagno elegante, riflesso naturale.",
  "selfie-party":
    "Selfie realistico in festa serale, luci soffuse, atmosfera vivace.",
};

const BASE_RULES = [
  "Mantieni fedelmente tatuaggi, piercing, nei, cicatrici, segni particolari e difetti.",
  "Non inventare accessori, modifiche estetiche o dettagli non presenti.",
  "Preserva somiglianza, struttura del viso, colore occhi e capelli.",
  "Realismo fotografico, pelle naturale, texture realistiche.",
  "Nessun telefono visibile nella mano se non esplicitamente richiesto.",
];

const HF_ENDPOINT =
  "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1";

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const buildPrompt = () => {
  const preset = PRESET_PROMPTS[presetSelect.value] || "";
  const free = freePrompt.value.trim();
  const rules = [...BASE_RULES];

  if (phoneToggle.checked) {
    rules.push("Telefono visibile solo se coerente con il prompt.");
  }

  if (mirrorToggle.checked) {
    rules.push("Inquadratura allo specchio, riflesso naturale.");
  }

  return [preset, free, rules.join(" ")].filter(Boolean).join(" ");
};

const createCard = (index) => {
  const card = document.createElement("div");
  card.className = "image-card";
  card.innerHTML = `
    <div class="image-frame">
      <div class="zoom">🔍</div>
    </div>
    <div class="image-actions">
      <span>Immagine ${index + 1}</span>
      <a class="download" href="#" download="booth-ai-${index + 1}.png">Download</a>
    </div>
  `;
  gallery.appendChild(card);
  return card;
};

const updateCardImage = (card, blobUrl) => {
  const frame = card.querySelector(".image-frame");
  frame.innerHTML = `<img src="${blobUrl}" alt="Selfie generato" />
    <div class="zoom">🔍</div>`;
  const download = card.querySelector(".download");
  download.href = blobUrl;
};

const createPayload = (prompt, dataUrl) => ({
  inputs: prompt,
  parameters: {
    image: dataUrl,
    num_inference_steps: 35,
    guidance_scale: 7,
  },
});

const requestImage = async (prompt, dataUrl, token) => {
  const response = await fetch(HF_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(createPayload(prompt, dataUrl)),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Errore nella richiesta API.");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = document.getElementById("photoInput").files[0];

  if (!file) {
    statusEl.textContent = "Carica una foto prima di generare.";
    return;
  }

  statusEl.textContent =
    "Preparazione in corso... le immagini usciranno una dopo l’altra.";
  gallery.innerHTML = "";

  const prompt = buildPrompt();
  const token = apiTokenInput.value.trim();
  const dataUrl = await readFileAsDataUrl(file);

  for (let i = 0; i < 4; i += 1) {
    statusEl.textContent = `Generazione immagine ${i + 1} di 4...`;
    const card = createCard(i);

    try {
      const imageUrl = await requestImage(prompt, dataUrl, token);
      updateCardImage(card, imageUrl);
    } catch (error) {
      card.querySelector(".image-frame").textContent =
        "Errore API. Controlla il token o prova un altro modello.";
      statusEl.textContent =
        "Si è verificato un errore. Verifica il token Hugging Face gratuito.";
      break;
    }
  }

  statusEl.textContent = "Completato. Scarica le immagini generate.";
});
