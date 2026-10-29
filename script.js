
import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

let products = [];

function formatPrice(price) {
  return Number(price).toLocaleString("fr-FR") + " DA";
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.papiToastTimer);
  window.papiToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

async function loadProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  container.innerHTML = "<p>Chargement des parfums...</p>";

  try {
    const snapshot = await getDocs(collection(db, "products"));

    products = snapshot.docs.map(item => ({
      ...item.data(),
      id: item.id
    }));

    renderProducts();
  } catch (error) {
    console.error("Erreur Firebase :", error);
    container.innerHTML =
      "<p>Impossible de charger les parfums. Vérifiez la connexion Firebase.</p>";
  }
}

function renderProducts() {
  const container = document.getElementById("products");
  if (!container) return;

  if (products.length === 0) {
    container.innerHTML =
      "<p>Aucun parfum disponible. Ajoutez des parfums depuis l'administration.</p>";
    return;
  }

  container.innerHTML = products.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
          onerror="this.onerror=null;this.src='https://placehold.co/600x700/191919/D5AD55?text=Papi+Store'"
        >
        <span class="product-tag">${escapeHTML(product.category)}</span>
      </div>

      <div class="product-info">
        <p class="product-category">PAPI STORE · COLLECTION</p>
        <h3>${escapeHTML(product.name)}</h3>
        <div class="product-bottom">
          <span class="product-price">${formatPrice(product.price)}</span>
          <button class="buy-button" data-buy="${escapeHTML(product.id)}">
            Commander ↗
          </button>
        </div>
      </div>
    </article>
  `).join("");

  container.querySelectorAll("[data-buy]").forEach(button => {
    button.addEventListener("click", () => {
      const product = products.find(
        item => item.id === button.dataset.buy
      );

      if (product) openOrder(product);
    });
  });
}

function openOrder(product) {
  const existing = document.getElementById("order-modal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "order-modal";
  modal.style.cssText = `
    position:fixed;inset:0;z-index:1000;background:#000c;
    display:flex;align-items:center;justify-content:center;
    padding:18px;overflow-y:auto;
  `;

  const wilayas = [
    "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna",
    "Béjaïa", "Biskra", "Béchar", "Blida", "Bouira",
    "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret", "Tizi Ouzou",
    "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
    "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa",
    "Mostaganem", "M'Sila", "Mascara", "Ouargla", "Oran",
    "El Bayadh", "Illizi", "Bordj Bou Arréridj", "Boumerdès",
    "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
    "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma",
    "Aïn Témouchent", "Ghardaïa", "Relizane", "Timimoun",
    "Bordj Badji Mokhtar", "Ouled Djellal", "Béni Abbès",
    "In Salah", "In Guezzam", "Touggourt", "Djanet",
    "El M'Ghair", "El Meniaa"
  ];

  modal.innerHTML = `
    <form id="order-form" autocomplete="on" style="
      background:#fff;color:#171717;width:100%;max-width:520px;
      padding:28px;border-top:5px solid #d5ad55;
      max-height:95vh;overflow-y:auto;
    ">
      <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
        <div>
          <p style="color:#9b772f;font-size:11px;letter-spacing:2px">PAPI STORE</p>
          <h2 style="margin-top:8px;font-family:Georgia,serif">Votre commande</h2>
        </div>
        <button type="button" id="close-order"
          aria-label="Fermer"
          style="border:0;background:none;font-size:26px;cursor:pointer">×</button>
      </div>

      <p style="margin:18px 0;padding:14px;background:#f6f2e9">
        ${escapeHTML(product.name)} —
        <strong>${formatPrice(product.price)}</strong>
      </p>

      <label style="display:block;margin:12px 0 6px">Nom et prénom *</label>
      <input name="fullName" type="text" required maxlength="100"
        style="width:100%;padding:12px;border:1px solid #ddd">

      <label style="display:block;margin:12px 0 6px">Téléphone *</label>
      <input name="phone" type="tel" required maxlength="20"
        placeholder="05 / 06 / 07..."
        style="width:100%;padding:12px;border:1px solid #ddd">

      <label style="display:block;margin:12px 0 6px">Wilaya *</label>
      <select name="wilaya" required
        style="width:100%;padding:12px;border:1px solid #ddd">
        <option value="">Choisir votre wilaya</option>
        ${wilayas.map((wilaya, index) => `
          <option value="${String(index + 1).padStart(2, "0")}">
            ${String(index + 1).padStart(2, "0")} — ${wilaya}
          </option>
        `).join("")}
      </select>

      <label style="display:block;margin:12px 0 6px">Adresse exacte *</label>
      <textarea name="address" required maxlength="300"
        placeholder="Commune, quartier, rue, numéro..."
        style="width:100%;padding:12px;border:1px solid #ddd;min-height:90px;resize:vertical"></textarea>

      <label style="display:block;margin:12px 0 6px">Quantité</label>
      <input name="quantity" type="number" min="1" max="20"
        value="1" required
        style="width:100%;padding:12px;border:1px solid #ddd">

      <p style="margin-top:16px;font-weight:bold">
        Total : <span id="order-total">${formatPrice(product.price)}</span>
      </p>

      <button type="submit" class="gold-button"
        style="width:100%;border:0;cursor:pointer">
        CONFIRMER LA COMMANDE
      </button>

      <p style="margin-top:12px;font-size:11px;color:#777">
        Vos informations seront envoyées pour traiter votre commande.
      </p>
    </form>
  `;

  document.body.appendChild(modal);

  const form = modal.querySelector("#order-form");
  const quantity = form.elements.quantity;
  const total = modal.querySelector("#order-total");
  const submitButton = form.querySelector('[type="submit"]');

  quantity.addEventListener("input", () => {
    const amount = Math.min(20, Math.max(1, Number(quantity.value) || 1));
    total.textContent = formatPrice(Number(product.price) * amount);
  });

  modal.querySelector("#close-order").addEventListener("click", () => {
    modal.remove();
  });

  modal.addEventListener("click", event => {
    if (event.target === modal) modal.remove();
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(form);
    const amount = Number(data.get("quantity"));

    const order = {
      fullName: String(data.get("fullName") || "").trim(),
      phone: String(data.get("phone") || "").trim(),
      wilaya: String(data.get("wilaya") || ""),
      wilayaCode: String(data.get("wilaya") || ""),
      address: String(data.get("address") || "").trim(),
      productId: product.id,
      productName: String(product.name),
      unitPrice: Number(product.price),
      quantity: amount,
      total: Number(product.price) * amount,
      status: "Nouvelle",
      createdAt: new Date().toISOString()
    };

    if (
      !order.fullName ||
      !order.phone ||
      !order.wilayaCode ||
      !order.address ||
      !Number.isInteger(amount) ||
      amount < 1 ||
      amount > 20
    ) {
      showToast("Veuillez remplir correctement tous les champs.");
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Enregistrement...";

    try {
      await addDoc(collection(db, "orders"), order);

      modal.remove();
      showToast("Commande enregistrée avec succès !");
    } catch (error) {
      console.error("Erreur d'enregistrement de la commande :", error);
      submitButton.disabled = false;
      submitButton.textContent = "CONFIRMER LA COMMANDE";
      showToast("Erreur Firebase : commande non enregistrée.");
    }
  });
}

document.addEventListener("DOMContentLoaded", loadProducts);
