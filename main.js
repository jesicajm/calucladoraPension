import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCNdCZZ3ZHnAb4N9wMJpt4Mrn5-DKBvuFE",
    authDomain: "padres-vida.firebaseapp.com",
    projectId: "padres-vida",
    storageBucket: "padres-vida.firebasestorage.app",
    messagingSenderId: "358254237263",
    appId: "1:358254237263:web:f8f9ef3114ccc6c5fa7c3a",
    measurementId: "G-64HFVNPCRM"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 🔹 Funciones auxiliares para Meta cookies
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
}

function getFbcFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const fbclid = urlParams.get("fbclid");
    if (fbclid) {
        const timestamp = Date.now();
        return `fb.1.${Math.floor(timestamp / 1000)}.${fbclid}`;
    }
    return null;
}

let step = 1;
let stepHistory = [];
let data = {
    nombre: '',
    ingresoMensual: '',
    numeroHijos: '',
    numeroWhatsapp: '',
    email: '',
    cedula: ''
};

async function guardarSolicitudCotizacion() {
    try {
        // Obtener IP pública
        const ipResponse = await fetch("https://api.ipify.org?format=json");
        const ipData = await ipResponse.json();
        const ip = ipData.ip;

        // Obtener user agent
        const userAgent = navigator.userAgent;

        // Obtener datos de Facebook cookies
        const fbp = getCookie("_fbp") || null;
        const fbc = getFbcFromUrl() || getCookie("_fbc") || null;

        const solicitud = {
            name: data.nombre,
            cedula: data.cedula,
            phone: data.numeroWhatsapp,
            email: data.email,
            ingresoMensual: parseFloat(data.ingresoMensual),
            numeroHijos: data.numeroHijos,
            ip,
            user_agent: userAgent,
            fbp,
            fbc,
            timestamp: serverTimestamp()
        }

        // Guardar en Firestore
        const docRef = await addDoc(collection(db, "solicitudes_cotizacion"), solicitud);

        console.log("✅ Solicitud enviada correctamente. Documento creado:", docRef.id);
        
    } catch (error) {
        console.error("❌ Error al guardar la solicitud:", error);
    }
}

function formatNumber(value) {
    return new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatInputCurrency(input) {
    let value = input.value.replace(/\D/g, '');
    if (value) {
        input.value = formatNumber(parseInt(value));
    }
}

function updateData(key, value) {
    data[key] = value;
}

function updateProgress() {
    const totalSteps = 6;
    const progress = (step / totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function updateNavigationButtons() {
    const navContainer = document.getElementById('navigationButtons');

    if (step > 1 && step <= 6) {
        navContainer.innerHTML = `
            <button class="nav-button" onclick="window.handleBack()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Atrás
            </button>
            <span class="step-indicator">${step} / 6</span>
        `;
    } else {
        navContainer.innerHTML = '';
    }
}

function handleNext() {
    stepHistory.push(step);

    switch (step) {
        case 1:
            if (!data.nombre) return;
            step = 2;
            break;
        case 2:
            if (!data.ingresoMensual) return;
            step = 3;
            break;
        case 3:
            if (!data.numeroHijos) return;
            step = 4;
            break;
        case 4:
            if (!data.numeroWhatsapp) return;
            step = 5;
            break;
        case 5:
            if (!data.email) return;
            step = 6;
            break;
        case 6:
            if (!data.cedula) return;
            step = 'final';
            break;
    }

    render();
}

function handleBack() {
    if (stepHistory.length > 0) {
        step = stepHistory.pop();
        render();
    }
}

function resetForm() {
    step = 1;
    stepHistory = [];
    data = {
        nombre: '',
        ingresoMensual: '',
        numeroHijos: '',
        numeroWhatsapp: '',
        email: '',
        cedula: ''
    };
    render();
}

function render() {
    const content = document.getElementById('content');
    updateProgress();
    updateNavigationButtons();

    switch (step) {
        case 1:
            content.innerHTML = `
            <h2>¿Cuál es tu nombre?</h2>
            <div class="input-wrapper">
                <input type="text" id="nombre" placeholder="David" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const nombreInput = document.getElementById('nombre');
            const nombreBtn = document.getElementById('nextBtn');

            if (data.nombre) {
                nombreInput.value = data.nombre;
                nombreBtn.disabled = false;
            }

            nombreInput.addEventListener('input', (e) => {
                updateData('nombre', e.target.value);
                nombreBtn.disabled = !e.target.value.trim();
            });
            nombreBtn.addEventListener('click', handleNext);
            break;

        case 2:
            content.innerHTML = `
            <h2>¿Cuál es tu ingreso mensual aproximado?</h2>
            <div class="input-wrapper">
                <input type="text" id="ingreso" placeholder="5000000" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const ingresoInput = document.getElementById('ingreso');
            const ingresoBtn = document.getElementById('nextBtn');

            if (data.ingresoMensual) {
                ingresoInput.value = formatNumber(data.ingresoMensual);
                ingresoBtn.disabled = false;
            }

            ingresoInput.addEventListener('input', (e) => {
                formatInputCurrency(e.target);
                const value = e.target.value.replace(/\D/g, '');
                updateData('ingresoMensual', value);
                ingresoBtn.disabled = !value;
            });
            ingresoBtn.addEventListener('click', handleNext);
            break;

        case 3:
            content.innerHTML = `
            <h2>¿Cuántos hijos tienes?</h2>
            <div class="options-grid">
                <button class="option-button" data-value="1">1 hijo</button>
                <button class="option-button" data-value="2">2 hijos</button>
                <button class="option-button" data-value="3">3 hijos</button>
                <button class="option-button" data-value="4">4 o más hijos</button>
            </div>
            `;

            document.querySelectorAll('.option-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    updateData('numeroHijos', e.target.dataset.value);
                    setTimeout(handleNext, 300);
                });
            });
            break;

        case 4:
            content.innerHTML = `
            <h2>¿Cuál es tu número de WhatsApp?</h2>
            <div class="input-wrapper">
                <input type="tel" id="whatsapp" placeholder="3001234567" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const whatsappInput = document.getElementById('whatsapp');
            const whatsappBtn = document.getElementById('nextBtn');

            if (data.numeroWhatsapp) {
                whatsappInput.value = data.numeroWhatsapp;
                whatsappBtn.disabled = false;
            }

            whatsappInput.addEventListener('input', (e) => {
                updateData('numeroWhatsapp', e.target.value);
                whatsappBtn.disabled = !e.target.value;
            });
            whatsappBtn.addEventListener('click', handleNext);
            break;

        case 5:
            content.innerHTML = `
            <h2>¿Cuál es tu correo electrónico?</h2>
            <div class="input-wrapper">
                <input type="email" id="email" placeholder="tu@email.com" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const emailInput = document.getElementById('email');
            const emailBtn = document.getElementById('nextBtn');

            if (data.email) {
                emailInput.value = data.email;
                emailBtn.disabled = false;
            }

            emailInput.addEventListener('input', (e) => {
                updateData('email', e.target.value);
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                emailBtn.disabled = !emailRegex.test(e.target.value);
            });
            emailBtn.addEventListener('click', handleNext);
            break;

        case 6:
            content.innerHTML = `
            <h2>¿Cuál es tu número de cédula?</h2>
            <div class="input-wrapper">
                <input type="text" id="cedula" placeholder="1234567890" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Finalizar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const cedulaInput = document.getElementById('cedula');
            const cedulaBtn = document.getElementById('nextBtn');

            if (data.cedula) {
                cedulaInput.value = data.cedula;
                cedulaBtn.disabled = false;
            }

            cedulaInput.addEventListener('input', (e) => {
                updateData('cedula', e.target.value);
                cedulaBtn.disabled = !e.target.value;
            });

            cedulaBtn.addEventListener('click', async () => {
                await guardarSolicitudCotizacion();
                handleNext();
            });
            break;

        case 'final':
            content.innerHTML = `
            <div class="text-center">
                <div class="icon-center">
                    <svg class="icon-xl" style="color: #16a34a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h2>📧 ¡Listo, ${data.nombre}!</h2>
                <div class="bg-blue" style="text-align: left; margin-bottom: 1.5rem;">
                    <p style="color: #374151; margin-bottom: 1rem;">
                        En breve, uno de nuestros asesores te escribirá por WhatsApp para 
                        mostrarte una opción personalizada de ahorro en dólares, diseñada para 
                        proteger a tu familia.
                    </p>
                    <p style="color: #4b5563; font-size: 0.875rem;">
                        💡 <strong>Recuerda:</strong> Proteger tu futuro y el de tu familia 
                        empieza con pequeñas decisiones hoy.
                    </p>
                </div>
                <button class="button button-secondary" onclick="window.resetForm()">
                    Realizar otra consulta
                </button>
            </div>
            `;
            
            // Ocultar navegación en la pantalla final
            document.getElementById('navigationButtons').innerHTML = '';
            document.getElementById('progressBar').style.width = '100%';
            break;
    }
}

// Exponer funciones al scope global
window.handleNext = handleNext;
window.handleBack = handleBack;
window.resetForm = resetForm;

// Inicializar la aplicación
render();