const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const axios = require("axios");
const crypto = require("crypto");

admin.initializeApp();


// 🔐 Cargar secretos
const META_ACCESS_TOKEN = defineSecret("META_ACCESS_TOKEN");
const META_PIXEL_ID = defineSecret("META_PIXEL_ID");

// 🔹 Encriptar datos para Meta
function hashSha256(value) {
  return crypto.createHash("sha256").update(value || "").digest("hex");
}



// 🔥 Función: enviar evento a Meta cuando alguien solicita una cotización
exports.enviarEventoMetaCotizacion = onDocumentCreated(
  {
    document: "solicitudes_cotizacion/{docId}",
    secrets: [META_ACCESS_TOKEN, META_PIXEL_ID],
  },
  async (event) => {
    const data = event.data.data();

    const email = data.email || "";
    const phone = data.numeroWhatsapp || "";
    const ingresoMensual = data.ingresoMensual || 0;
    const ip = data.ip || "";
    const user_agent = data.user_agent || "";
    const fbp = data.fbp ? String(data.fbp) : null;
    const fbc = data.fbc ? String(data.fbc) : null;

    // Solo personas con ingresos > 4.000.000
    if (ingresoMensual < 4000000) {
      console.log("⏩ Ingreso menor a 4M, no se envía a Meta:", ingresoMensual);
      return null;
    }

    const accessToken = META_ACCESS_TOKEN.value();
    const pixelId = META_PIXEL_ID.value();

    if (!accessToken || !pixelId) {
      console.error("❌ Faltan secretos META_ACCESS_TOKEN o META_PIXEL_ID");
      return null;
    }

    const eventData = {
      data: [
        {
          event_name: "Lead",
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: {
            em: hashSha256(email),
            ph: hashSha256(phone),
            client_ip_address: ip,
            client_user_agent: user_agent,
            fbp: fbp,
            fbc: fbc,
          },
          custom_data: {
            ingresoMensual: ingresoMensual,
          },
        },
      ],
    };

    try {
      console.log("📦 Enviando evento a Meta:", eventData);

      const response = await axios.post(
        `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
        eventData
      );

      console.log("✅ Evento enviado correctamente:", response.data);
    } catch (error) {
      console.error("❌ Error al enviar evento a Meta:", error.response?.data || error.message);
    }
  }
);