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

const SALARIO_MINIMO_2025 = 1423500;
const TRM_USD = 3804.09; // Tasa representativa del mercado
const CAPITAL_USD = 100000;
const APORTE_ANUAL_USD = 617;
const ANOS_PLAN = 15;

let step = 1;
let stepHistory = [];
let data = {
    nombre: '',
    origenIngresos: '',
    ingresoMensual: '',
    cotizaActualmente: '',
    anosCotizados: '',
    semanasCotizadas: '',
    cotizaSobreIngreso: '',
    valorCotizacion: '',
    quiereCotizacion: '',
    cedula: '',
    numeroHijos: '',
    numeroWhatsapp: '',
    email: ''
};
let resultado = null;

const tablaPorcentajesSobrevivencia = [
    { semanas: 549, porcentaje: 0.45 },
    { semanas: 550, porcentaje: 0.47 },
    { semanas: 600, porcentaje: 0.49 },
    { semanas: 650, porcentaje: 0.51 },
    { semanas: 700, porcentaje: 0.53 },
    { semanas: 750, porcentaje: 0.55 },
    { semanas: 800, porcentaje: 0.57 },
    { semanas: 850, porcentaje: 0.59 },
    { semanas: 900, porcentaje: 0.61 },
    { semanas: 950, porcentaje: 0.63 },
    { semanas: 1000, porcentaje: 0.65 },
    { semanas: 1050, porcentaje: 0.67 },
    { semanas: 1100, porcentaje: 0.69 },
    { semanas: 1150, porcentaje: 0.71 },
    { semanas: 1200, porcentaje: 0.73 },
    { semanas: 1250, porcentaje: 0.75 }
];

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
            origenIngresos: data.origenIngresos,
            cotizaActualmente: data.cotizaActualmente,
            anosCotizados: data.anosCotizados,
            numeroHijos: data.numeroHijos,
            ip,
            user_agent: userAgent,
            fbp,
            fbc,
            resultado: resultado,
            timestamp: serverTimestamp()
        }

        // Guardar en Firestore
        const docRef = await addDoc(collection(db, "solicitudes_cotizacion"), solicitud);

        console.log("✅ Solicitud enviada correctamente. Documento creado:", docRef.id);
    } catch (error) {
        console.error("❌ Error al guardar la solicitud:", error);
    }
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
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

function obtenerPorcentajeSobrevivencia(semanas) {
    if (semanas < 549) {
        return 0;
    }
    if (semanas >= 1250) {
        return 0.75;
    }

    let porcentajeAplicable = 0.45;

    for (let i = 0; i < tablaPorcentajesSobrevivencia.length; i++) {
        if (semanas >= tablaPorcentajesSobrevivencia[i].semanas) {
            porcentajeAplicable = tablaPorcentajesSobrevivencia[i].porcentaje;
        } else {
            break;
        }
    }

    return porcentajeAplicable;
}
function calcularPension() {
    const anos = parseFloat(data.anosCotizados) || 0;
    const semanas = anos * 52;
    const ingreso = parseFloat(data.ingresoMensual) || 0;

    const ibc = data.cotizaSobreIngreso === 'si' ? ingreso : (parseFloat(data.valorCotizacion) || ingreso);
    const ibl = ibc * 0.625;
    const porcentajeSobrevivencia = obtenerPorcentajeSobrevivencia(semanas);

    let pensionSobrevivencia = 0;
    let aplicaSalarioMinimo = false;
    let cumpleRequisitos = false;

    if (data.cotizaActualmente === 'si') {
        pensionSobrevivencia = ibl * porcentajeSobrevivencia;

        if (pensionSobrevivencia < SALARIO_MINIMO_2025) {
            pensionSobrevivencia = SALARIO_MINIMO_2025;
            aplicaSalarioMinimo = true;
        }

        cumpleRequisitos = true;
    } else {
        pensionSobrevivencia = 0;
        cumpleRequisitos = false;
        aplicaSalarioMinimo = false;
    }

    const numHijos = parseInt(data.numeroHijos) || 0;
    const ingresoActual = ingreso;
    const brecha = Math.max(0, ingresoActual - pensionSobrevivencia);
    const porcentajeBrecha = ingresoActual > 0 ? ((brecha / ingresoActual) * 100).toFixed(1) : 0;
    const esSuficiente = brecha < (ingresoActual * 0.30);

    // Cálculos del plan de ahorro
    const perdidaAnual = brecha * 12;
    const aporteAnualCOP = APORTE_ANUAL_USD * TRM_USD;
    const totalAportado = APORTE_ANUAL_USD * ANOS_PLAN;
    const totalAportadoCOP = totalAportado * TRM_USD;

    resultado = {
        ibc: ibc,
        ibl: ibl,
        pensionSobrevivencia,
        porcentajeSobrevivencia: (porcentajeSobrevivencia * 100).toFixed(0),
        semanas: Math.round(semanas),
        brecha,
        porcentajeBrecha,
        cumpleRequisitos,
        numHijos,
        esSuficiente,
        aplicaSalarioMinimo,
        cotizaActualmente: data.cotizaActualmente,
        // Datos del plan de ahorro
        perdidaAnual,
        capitalUSD: CAPITAL_USD,
        aporteAnualUSD: APORTE_ANUAL_USD,
        aporteAnualCOP,
        anosPlan: ANOS_PLAN,
        totalAportadoUSD: totalAportado,
        totalAportadoCOP
    };
}

function updateData(field, value) {
    data[field] = value;
}

function handleNext() {
    if (typeof step === 'number' || typeof step === 'string') {
        stepHistory.push(step);
    }

    if (step === 2 && data.origenIngresos === 'ya_soy_pensionado') {
        step = 'pensionado_info';
    } else if (step === 'pensionado_info') {
        step = 10;
} else if (step === 4 && data.cotizaActualmente === 'no') {
    data.anosCotizados = '0';
    calcularPension();
    step = 'no_cotiza_advertencia';
} else if (step === 'no_cotiza_advertencia') {
    if (resultado && resultado.brecha > 0) {
        step = 'plan_ahorro';
    } else {
        step = 10;
    }
    } else if (step === 6 && data.cotizaSobreIngreso === 'si') {
        step = 8;
    } else if (step === 8) {
        calcularPension();
        step = 9;
    } else if (step === 9) {
        // NUEVO: Después del paso 9, ir al plan de ahorro si hay brecha
        if (resultado && resultado.brecha > 0) {
            step = 'plan_ahorro';
        } else {
            step = 10;
        }
    } else if (step === 'plan_ahorro') {
        step = 10;
    } else if (step === 10 && data.quiereCotizacion === 'no') {
        step = 'final_no';
    } else if (step === 10 && data.quiereCotizacion === 'si') {
        step = 11;
    } else if (step === 11) {
        step = 12;
    } else if (step === 12) {
        step = 13;
    } else if (step === 13) {
        step = 'final_si';
    } else {
        step++;
    }

    render();
}

function handleBack() {
    if (stepHistory.length > 0) {
        step = stepHistory.pop();
        render();
    }
}

function handleRestart() {
    stepHistory = [];
    step = 1;
    data = {
        nombre: '',
        origenIngresos: '',
        ingresoMensual: '',
        cotizaActualmente: '',
        anosCotizados: '',
        semanasCotizadas: '',
        cotizaSobreIngreso: '',
        valorCotizacion: '',
        quiereCotizacion: '',
        cedula: '',
        numeroHijos: '',
        numeroWhatsapp: '',
        email: ''
    };
    resultado = null;
    render();
}

function resetForm() {
    stepHistory = [];
    step = 1;
    data = {
        nombre: '',
        origenIngresos: '',
        ingresoMensual: '',
        cotizaActualmente: '',
        anosCotizados: '',
        semanasCotizadas: '',
        cotizaSobreIngreso: '',
        valorCotizacion: '',
        quiereCotizacion: '',
        cedula: '',
        numeroHijos: '',
        numeroWhatsapp: '',
        email: ''
    };
    resultado = null;
    render();
}

function updateNavigationButtons() {
    const navContainer = document.getElementById('navigationButtons');
    const canGoBack = stepHistory.length > 0;
    const isNotFinal = step !== 'final_si' && step !== 'final_no';

    if (isNotFinal && step !== 1) {
        navContainer.innerHTML = `
            <button class="nav-button" onclick="window.handleBack()" ${!canGoBack ? 'disabled' : ''}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Atrás
            </button>
            <button class="nav-button" onclick="window.handleRestart()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                </svg>
                Reiniciar
            </button>
        `;
    } else {
        navContainer.innerHTML = '';
    }
}

function updateProgress() {
    const progressBar = document.getElementById('progressBar');
    if (step === 'final_si' || step === 'final_no') {
        progressBar.style.width = '100%';
    } else if (step === 'pensionado_info' || step === 'no_cotiza_advertencia') {
        progressBar.style.width = '70%';
    } else if (step === 'plan_ahorro') {
        progressBar.style.width = '75%';
    } else if (typeof step === 'number') {
        progressBar.style.width = `${(step / 13) * 100}%`;
    }
}

function render() {
    updateProgress();
    updateNavigationButtons();
    const content = document.getElementById('content');

    switch (step) {
        case 1:
            content.innerHTML = `
            <div class="icon-center">
                <svg class="icon" style="color: #2563eb;" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
            </div>
            <h2 class="text-center">¿Cuál es tu nombre?</h2>
            <div class="input-wrapper">
                <input type="text" id="nombre" placeholder="Escribe tu nombre" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const nombreInput = document.getElementById('nombre');
            const nextBtn = document.getElementById('nextBtn');

            if (data.nombre) {
                nombreInput.value = data.nombre;
                nextBtn.disabled = false;
            }

            nombreInput.addEventListener('input', (e) => {
                updateData('nombre', e.target.value);
                nextBtn.disabled = !e.target.value;
            });
            nextBtn.addEventListener('click', handleNext);
            break;

        case 2:
            content.innerHTML = `
            <h2>${data.nombre}, calculemos tu pensión ¿De dónde provienen tus ingresos?</h2>
            <button class="option-button" data-value="trabajo_independiente">Trabajo independiente</button>
            <button class="option-button" data-value="empleado">Empleado</button>
            <button class="option-button" data-value="empresario">Empresario</button>
            <button class="option-button" data-value="ya_soy_pensionado">Ya soy pensionado</button>
            `;

            document.querySelectorAll('.option-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    updateData('origenIngresos', e.target.dataset.value);
                    setTimeout(handleNext, 300);
                });
            });
            break;

        case 3:
            content.innerHTML = `
            <h2>¿Cuál es tu ingreso mensual actual?</h2>
            <div class="input-wrapper">
                <input type="text" id="ingreso" class="input-with-prefix" placeholder="0" autofocus>
            </div>
            <div class="info-box">
                <p>💡 Este será considerado como tu Ingreso Base de Cotización (IBC) para el cálculo.</p>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const ingresoInput = document.getElementById('ingreso');
            const ingresoBtn = document.getElementById('nextBtn');

            if (data.ingresoMensual) {
                ingresoInput.value = formatNumber(parseFloat(data.ingresoMensual));
            }

            ingresoInput.addEventListener('input', (e) => {
                formatInputCurrency(e.target);
                const rawValue = e.target.value.replace(/\./g, '');
                updateData('ingresoMensual', rawValue);
                ingresoBtn.disabled = !rawValue || parseFloat(rawValue) <= 0;
            });
            ingresoBtn.addEventListener('click', handleNext);
            break;

        case 4:
            content.innerHTML = `
            <h2>¿Cotizas a pensión obligatoria actualmente?</h2>
            <button class="option-button" data-value="si">Sí</button>
            <button class="option-button" data-value="no">No</button>
            `;

            document.querySelectorAll('.option-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    updateData('cotizaActualmente', e.target.dataset.value);
                    setTimeout(handleNext, 300);
                });
            });
            break;

        case 5:
            content.innerHTML = `
            <h2>¿Cuántos años llevas cotizando?</h2>
            <div class="input-wrapper">
                <input type="number" id="anos" placeholder="Años" autofocus>
            </div>
            <div class="info-box">
                <p>📊 Necesitas mínimo 10.5 años (549 semanas) cotizados para tener derecho a pensión de
                    sobrevivencia.</p>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const anosInput = document.getElementById('anos');
            const anosBtn = document.getElementById('nextBtn');

            if (data.anosCotizados) {
                anosInput.value = data.anosCotizados;
            }

            anosInput.addEventListener('input', (e) => {
                updateData('anosCotizados', e.target.value);
                anosBtn.disabled = !e.target.value || parseFloat(e.target.value) < 0;
            });
            anosBtn.addEventListener('click', handleNext);
            break;

        case 6:
            content.innerHTML = `
            <h2>¿Cotizas sobre ${formatCurrency(parseFloat(data.ingresoMensual))}?</h2>
            <button class="option-button" data-value="si">Sí</button>
            <button class="option-button" data-value="no">No</button>
            `;

            document.querySelectorAll('.option-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    updateData('cotizaSobreIngreso', e.target.dataset.value);
                    setTimeout(handleNext, 300);
                });
            });
            break;

        case 7:
            content.innerHTML = `
            <h2>¿Sobre qué valor cotizas?</h2>
            <div class="input-wrapper">
                <input type="text" id="valor" class="input-with-prefix" placeholder="0" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const valorInput = document.getElementById('valor');
            const valorBtn = document.getElementById('nextBtn');

            if (data.valorCotizacion) {
                valorInput.value = formatNumber(parseFloat(data.valorCotizacion));
            }

            valorInput.addEventListener('input', (e) => {
                formatInputCurrency(e.target);
                const rawValue = e.target.value.replace(/\./g, '');
                updateData('valorCotizacion', rawValue);
                valorBtn.disabled = !rawValue || parseFloat(rawValue) <= 0;
            });
            valorBtn.addEventListener('click', handleNext);
            break;

        case 8:
            content.innerHTML = `
            <h2>¿Cuántos hijos menores de edad o dependientes tienes?</h2>
            <div class="input-wrapper">
                <input type="number" id="hijos" placeholder="Número de hijos" min="0" autofocus>
            </div>
            <div class="info-box">
                <p>👨‍👩‍👧‍👦 <strong>Requisitos para que tus hijos reciban la pensión:</strong><br>
                    • Ser menores de 18 años, o<br>
                    • Tener entre 18 y 25 años y estar estudiando, o<br>
                    • Tener discapacidad (sin límite de edad)</p>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Calcular
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const hijosInput = document.getElementById('hijos');
            const hijosBtn = document.getElementById('nextBtn');

            if (data.numeroHijos) {
                hijosInput.value = data.numeroHijos;
            }

            hijosInput.addEventListener('input', (e) => {
                updateData('numeroHijos', e.target.value);
                hijosBtn.disabled = e.target.value === '';
            });
            hijosBtn.addEventListener('click', handleNext);
            break;

            case 9:
                const mensajeSuficiencia = resultado.esSuficiente
                    ? `<div class="result-item bg-green">
                    <p class="result-label">✅ Análisis de suficiencia</p>
                    <p class="text-green" style="font-size: 1rem; font-weight: 600;">
                        La pensión de sobrevivencia cubriría adecuadamente las necesidades básicas de tu familia
                    </p>
                    <p class="result-note">La brecha es menor al 30% de tus ingresos actuales</p>
                </div>`
                    : `<div class="result-item bg-red">
                    <p class="result-label">⚠️ Análisis de suficiencia</p>
                    <p class="text-red" style="font-size: 1rem; font-weight: 600;">
                        La pensión de sobrevivencia NO sería suficiente para mantener el nivel de vida actual de tu familia
                    </p>
                    <p class="result-note">Existe una brecha significativa del ${resultado.porcentajeBrecha}%</p>
                </div>`;
            
                const alertaNoCotiza = data.cotizaActualmente === 'no' ? `<div class="alert-box" style="background-color: #fee2e2; border-color: #fca5a5;">
                    <p><strong>🚫 ATENCIÓN:</strong> Como NO cotizas actualmente a pensión, 
                    <strong>tu familia NO recibiría ninguna pensión de sobrevivencia</strong> si algo te llegara a pasar.</p>
                </div>` : '';
            
                const alertaSemanas = data.cotizaActualmente === 'si' && resultado.semanas < 549 ? `<div class="info-box" style="background-color: #fef3c7; border-color: #fbbf24;">
                    <p><strong>⚠️ IMPORTANTE:</strong> Aunque actualmente cotizas, solo llevas ${formatNumber(resultado.semanas)} semanas 
                    (${Math.floor(parseFloat(data.anosCotizados))} años). Sin embargo, <strong>tu familia recibiría el salario mínimo legal vigente 
                    (${formatCurrency(SALARIO_MINIMO_2025)})</strong> como pensión de sobrevivencia por el hecho de que estás cotizando.</p>
                </div>` : '';
            
                const mensajeSalarioMinimo = resultado.aplicaSalarioMinimo ? `
                <div class="info-box" style="background-color: #dbeafe; border-color: #93c5fd;">
                    <p><strong>💰 Ajuste por Salario Mínimo:</strong> Aunque el cálculo basado en tus semanas cotizadas 
                    daría un valor menor, la pensión se garantiza con el salario mínimo legal vigente 
                    (${formatCurrency(SALARIO_MINIMO_2025)}) porque estás cotizando actualmente.</p>
                </div>` : '';
            
                content.innerHTML = `
                <div class="results-box">
                    <h2 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
                        <svg width="32" height="32" style="color: #16a34a;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg>
                        Resultados de tu Pensión de Sobrevivencia
                    </h2>
            
                    ${alertaNoCotiza}
                    ${alertaSemanas}
            
                    ${data.cotizaActualmente === 'si' ? `
                    <div class="result-item bg-blue">
                        <p class="result-label">📊 Datos de cotización</p>
                        <p style="font-size: 1rem; color: #1f2937; margin-bottom: 0.5rem;">
                            <strong>Semanas cotizadas:</strong> ${formatNumber(resultado.semanas)} semanas (${Math.floor(parseFloat(data.anosCotizados))} años)
                        </p>
                        <p style="font-size: 1rem; color: #1f2937;">
                            <strong>Porcentaje aplicable:</strong> ${resultado.porcentajeSobrevivencia}% del IBL
                        </p>
                        <p class="result-note">Ingreso Base de Liquidación (IBL): ${formatCurrency(resultado.ibl)}</p>
                    </div>
            
                    ${mensajeSalarioMinimo}
            
                    <div class="result-item bg-green">
                        <p class="result-label">💰 Pensión de sobrevivencia estimada</p>
                        <p class="result-value text-green">${formatCurrency(resultado.pensionSobrevivencia)}</p>
                        <p class="result-note">Esta es la pensión mensual que recibiría tu familia (cónyuge e hijos)</p>
                    </div>
            
                    <div class="result-item bg-red">
                        <p class="result-label">📉 Brecha pensional</p>
                        <p class="result-value text-red">${formatCurrency(resultado.brecha)}</p>
                        <p class="result-note">(${resultado.porcentajeBrecha}% de tus ingresos actuales)</p>
                    </div>
            
                    ${mensajeSuficiencia}
            
                    <div class="bg-yellow">
                        <p style="font-size: 0.875rem; color: #374151;">
                            <strong>⚠️ Importante:</strong> Esta brecha de ${formatCurrency(resultado.brecha)} es lo que tu familia dejaría de recibir mensualmente. 
                            Un plan de ahorro puede cubrir esta diferencia y garantizar el bienestar de tus seres queridos.
                        </p>
                    </div>
                    ` : `
                    <div class="result-item bg-red">
                        <p class="result-label">❌ Sin pensión de sobrevivencia</p>
                        <p class="result-value text-red">$0</p>
                        <p class="result-note">Al no cotizar actualmente, no hay derecho a pensión</p>
                    </div>
            
                    <div class="result-item bg-red">
                        <p class="result-label">📉 Pérdida total de ingresos</p>
                        <p class="result-value text-red">${formatCurrency(parseFloat(data.ingresoMensual))}</p>
                        <p class="result-note">100% de tus ingresos actuales que tu familia perdería</p>
                    </div>
            
                    <div class="bg-yellow">
                        <p style="font-size: 0.875rem; color: #374151;">
                            <strong>🚨 CRÍTICO:</strong> Sin cotizar a pensión, tu familia quedaría completamente desprotegida 
                            y perdería el 100% de tus ingresos (${formatCurrency(parseFloat(data.ingresoMensual))}/mes). 
                            Una póliza de vida es ESENCIAL para protegerlos.
                        </p>
                    </div>
                    `}
                </div>
            
                <button class="button button-primary" onclick="window.handleNext()">
                    ${resultado.brecha > 0 ? 'Ver plan de protección' : 'Continuar'}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                `;
                break;

    case 'no_cotiza_advertencia':
    // Asegurarnos de que resultado existe
    if (!resultado) {
        data.anosCotizados = '0';
        calcularPension();
    }
    
    content.innerHTML = `
    <div class="text-center">
        <div class="icon-center">
            <svg class="icon-xl" style="color: #dc2626;" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
        </div>
        <h2>⚠️ Situación crítica detectada</h2>
        <div class="alert-box" style="margin-bottom: 1.5rem;">
            <p style="margin-bottom: 1rem; font-size: 1rem;">
                <strong>${data.nombre}, esto es lo que debes saber:</strong>
            </p>
            <p style="margin-bottom: 0.75rem;">
                🚫 Al <strong>NO cotizar a pensión</strong>, si algo te llegara a pasar:
            </p>
            <ul style="list-style: none; padding-left: 1rem; margin-bottom: 1rem;">
                <li style="margin-bottom: 0.5rem;">❌ Tus hijos NO recibirían ninguna
                    pensión de sobrevivencia</li>
                <li style="margin-bottom: 0.5rem;">❌ Tu cónyuge NO recibiría ningún
                    ingreso del sistema pensional</li>
                <li style="margin-bottom: 0.5rem;">❌ Tu familia quedaría en total
                    desprotección económica</li>
            </ul>
        </div>

        <div class="bg-red"
            style="padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem; text-align: left;">
            <p style="color: #7f1d1d; font-weight: bold; margin-bottom: 0.75rem; font-size: 1rem;">
                🚨 El impacto real en tu familia:
            </p>
            <p style="color: #374151; margin-bottom: 0.5rem; font-size: 0.95rem;">
                • Perderían el <strong>100% de tus ingresos</strong> mensuales
                (${formatCurrency(parseFloat(data.ingresoMensual) || 0)})
            </p>
            <p style="color: #374151; margin-bottom: 0.5rem; font-size: 0.95rem;">
                • No habría recursos para alimentación, educación, vivienda ni salud
            </p>
            <p style="color: #374151; font-size: 0.95rem;">
                • Tus hijos podrían tener que dejar de estudiar y trabajar
                prematuramente
            </p>
        </div>

        <div class="info-box">
            <p style="font-weight: bold; margin-bottom: 0.5rem;">💡 ¿Qué puedes hacer HOY?</p>
            <p style="margin-bottom: 0.5rem;">1. <strong>Empieza a cotizar a pensión</strong> cuanto antes (necesitas mínimo 10.5 años)</p>
            <p>2. <strong>Contrata un plan de ahorro</strong> que proteja a tu familia AHORA (no requiere años de espera)</p>
        </div>

        <div class="bg-yellow" style="margin-top: 1rem;">
            <p style="font-size: 0.875rem; color: #374151;">
                <strong>🛡️ Un plan de ahorro es tu red de protección inmediata</strong><br>
                Desde hoy mismo, tu familia estaría protegida económicamente. No esperes años cotizando, actúa ahora.
            </p>
        </div>
    </div>
    <button class="button button-primary" onclick="window.handleNext()">
        Ver plan de protección
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    </button>
    `;
    break;
               
            
            // NUEVO CASE: plan_ahorro
            case 'plan_ahorro':
                content.innerHTML = `
                <div class="plan-ahorro-section">
                    <h2 style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: #047857;">
                        🛡️ Tu Plan de Ahorro en Dólares para Cerrar Esta Brecha
                    </h2>
                    
            
                    <div class="escenario-card escenario-hoy">
                        <h3>1️⃣ Si hoy te pasa algo</h3>
                        <p class="escenario-descripcion">
                            Tus hijos dejarían de recibir <strong>${formatCurrency(resultado.brecha)}</strong> cada mes, 
                            lo que representa una pérdida total anual de <strong>${formatCurrency(resultado.perdidaAnual)}</strong> en ingresos familiares.
                        </p>

                        <p>Para cubrir esa pérdida desde el día 1, lo mínimo y más realista es garantizarles:</p>
                        
                        <div class="capital-objetivo">
                            <p class="capital-titulo">🎯 Un capital inmediato de USD ${formatNumber(resultado.capitalUSD)}</p>
                            <p class="capital-subtitulo">Ese monto permite reemplazar ingresos y dar estabilidad a tus hijos durante varios años.</p>
                        </div>
            
                        <div class="calculo-aporte">
                            <h4>📌 ¿Qué representa este plan para ti?</h4>
                            <p>Si decides aportar <strong>USD ${formatNumber(Math.ceil(resultado.aporteAnualUSD))}</strong> al año 
                            (≈ <strong>${formatCurrency(Math.ceil(resultado.aporteAnualCOP))}</strong> usando la TRM actual de 1 USD = COP ${formatNumber(Math.ceil(TRM_USD))}):</p>
                            <ul class="beneficios-list">
                                <li>En <strong>${resultado.anosPlan} años</strong> habrás aportado: <strong>USD ${formatNumber(Math.ceil(resultado.totalAportadoUSD))} en total</strong> 
                                (${resultado.aporteAnualUSD} × ${resultado.anosPlan})</li>
                                <li>Pero si hoy te pasa algo, tus hijos reciben <strong> USD ${formatNumber(resultado.capitalUSD)} </strong> completos, aun si has aportado muy poco hasta el momento.</li>
                            </ul>
            
            
                        </div>
                    </div>
            
                    <div class="escenario-card escenario-futuro">
                        <h3>2️⃣ Si NO te pasa nada en los próximos ${resultado.anosPlan} años</h3>
                        <p class="escenario-descripcion">
                            Tu dinero no se pierde. <strong>Todo lo que aportaste se devuelve en dólares.</strong>
                            <div class="devolucion-valor">
                                <div class="valor-cop">🟩 Recibirías USD ${formatNumber(resultado.capitalUSD)}</div>
                                <p class="valor-nota">Ahorro protegido en dólares, sin perder valor.</p>
                            </div>     </p>
            
            
                            <div class="ventaja-dolares">
                                <p>Y a diferencia de ahorrar en pesos, este capital no se devalúa con el tiempo.</p>
                            </div>
                        </div>
                    </div>
                </div>
            
                <button class="button button-primary" onclick="window.handleNext()">
                    Quiero proteger a mi familia
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                `;
                break;

        case 10:
            content.innerHTML = `
            <h2>¿Quieres recibir un plan de ahorro en dólares a tu WhatsApp adaptada a tu
                perfil, ingresos y necesidades?</h2>
            <button class="option-button" data-value="si">Sí, quiero proteger a mi
                familia</button>
            <button class="option-button" data-value="no">No, gracias</button>
            `;

            document.querySelectorAll('.option-button').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    updateData('quiereCotizacion', e.target.dataset.value);
                    setTimeout(handleNext, 300);
                });
            });
            break;

        case 11:
            content.innerHTML = `
            <h2>¿Cuál es tu número de WhatsApp?</h2>
            <div class="input-wrapper">
                <input type="tel" id="whatsapp" placeholder="300 123 4567" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const whatsappInput = document.getElementById('whatsapp');
            const whatsappBtn = document.getElementById('nextBtn');

            if (data.numeroWhatsapp) {
                whatsappInput.value = data.numeroWhatsapp;
            }

            whatsappInput.addEventListener('input', (e) => {
                updateData('numeroWhatsapp', e.target.value);
                whatsappBtn.disabled = !e.target.value;
            });
            whatsappBtn.addEventListener('click', handleNext);
            break;

        case 12:
            content.innerHTML = `
            <h2>¿Cuál es tu correo electrónico?</h2>
            <div class="input-wrapper">
                <input type="email" id="email" placeholder="tu@email.com" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Continuar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
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
                // Validación básica de email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                emailBtn.disabled = !emailRegex.test(e.target.value);
            });
            emailBtn.addEventListener('click', handleNext);
            break;

        case 13:
            content.innerHTML = `
            <h2>¿Cuál es tu número de cédula?</h2>
            <div class="input-wrapper">
                <input type="text" id="cedula" placeholder="1234567890" autofocus>
            </div>
            <button class="button button-primary" id="nextBtn" disabled>
                Finalizar
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
            </button>
            `;

            const cedulaInput = document.getElementById('cedula');
            const cedulaBtn = document.getElementById('nextBtn');

            if (data.cedula) {
                cedulaInput.value = data.cedula;
            }

            cedulaInput.addEventListener('input', (e) => {
                updateData('cedula', e.target.value);
                cedulaBtn.disabled = !e.target.value;
            });

            cedulaBtn.addEventListener('click', async () => {
                if (data.quiereCotizacion === 'si') {
                    await guardarSolicitudCotizacion();
                }
                handleNext();
            });
            break;

        case 'final_si':
            content.innerHTML = `
            <div class="text-center">
                <div class="icon-center">
                    <svg class="icon-xl" style="color: #16a34a;" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h2>📧 ¡Listo, ${data.nombre}!</h2>
                <div class="bg-blue" style="text-align: left; margin-bottom: 1.5rem;">
                    <p style="color: #374151; margin-bottom: 1rem;">
                        En breve, uno de nuestros asesores te escribirá por WhatsApp para
                        mostrarte una opción personalizada, diseñada para proteger a tu familia
                        incluso si tú no estás.
                    </p>
                    <p style="color: #4b5563; font-size: 0.875rem;">
                        💡 <strong>Recuerda:</strong> No se trata de cuánto ganas hoy, sino de
                        qué tan protegido estás.
                    </p>
                </div>
                <button class="button button-secondary" onclick="window.resetForm()">
                    Realizar otra consulta
                </button>
            </div>
            `;
            break;

        case 'final_no':
            content.innerHTML = `
            <div class="text-center">
                <div class="icon-center">
                    <svg class="icon-xl" style="color: #4b5563;" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                </div>
                <h2>Entendemos que no estés listo ahora</h2>
                <div class="bg-gray" style="text-align: left; margin-bottom: 1.5rem;">
                    <p style="color: #374151; margin-bottom: 1rem;">
                        🕐 Cuando estés listo para proteger lo más importante, estaremos aquí
                        para ayudarte.
                    </p>
                    <p style="color: #4b5563; font-size: 0.875rem;">
                        📋 <strong>Porque la vida no está garantizada, pero tu previsión sí
                            puede estarlo.</strong>
                    </p>
                    <p style="color: #4b5563; font-size: 0.875rem; margin-top: 1rem;">
                        Gracias por completar el test. 💙
                    </p>
                </div>
                <button class="button button-secondary" onclick="window.resetForm()">
                    Realizar otra consulta
                </button>
            </div>
            `;
            break;
    }
}

// Exponer funciones al scope global para que los botones puedan accederlas
window.handleNext = handleNext;
window.handleBack = handleBack;
window.handleRestart = handleRestart;
window.resetForm = resetForm;

// Inicializar la aplicación
render();