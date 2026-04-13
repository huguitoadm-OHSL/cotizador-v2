import React, { useState, useEffect, useRef } from "react";
import { Calculator, Send, Map, DollarSign, Percent, Calendar, CheckCircle2, Building2, ChevronRight, FileText, Tag, MapPin, Gift, Sparkles, TrendingUp, ShieldCheck, Scale, TableProperties, UserCircle, BadgeCheck, X, Activity, Lock, Copy, RefreshCw, Check, MessageSquareText, Database, Edit3 } from "lucide-react";

// --- COMPONENTE DE ANIMACIÓN DE NÚMEROS ---
const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let startTime;
    const startValue = displayValue;
    const duration = 800;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); 
      
      setDisplayValue(startValue + (value - startValue) * ease);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(value);
      }
    };
    
    if (startValue !== value) {
      window.requestAnimationFrame(step);
    }
  }, [value]);

  return <>{new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(displayValue)}</>;
};

export default function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === "MVENTAS26") {
      setIsAuthenticated(true);
      setLoginError("");
    } else {
      setLoginError("Contraseña incorrecta. Intente nuevamente.");
    }
  };

  // --- ESTADOS DE DATOS (BASE DE DATOS EXTERNA) ---
  const [lotesDB, setLotesDB] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // --- EFECTO PARA CARGAR LOS 20,000 LOTES ---
  useEffect(() => {
    const fetchLotes = async () => {
      try {
        if (window.location.protocol === 'blob:' || window.location.origin === 'null') {
          throw new Error("ENTORNO_VISTA_PREVIA");
        }

        const response = await fetch('/lotes.json');
        if (!response.ok) throw new Error("ERROR_404");
        const text = await response.text();
        
        try {
          const rawData = JSON.parse(text);
          const dataArray = Array.isArray(rawData) ? rawData : [];
          
          // --- AUTO-SANADOR DE DATOS (Escáner de Puntuación Inteligente v2.0) ---
          const normalizedData = dataArray.map(item => {
            const rawKeys = Object.keys(item);
            
            const getValue = (matchWords, highPriorityWords = [], avoidWords = []) => {
                let bestKey = null;
                let bestScore = -1;

                rawKeys.forEach(k => {
                    const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                    let score = 0;
                    
                    matchWords.forEach(w => {
                        if (cleanKey.includes(w)) score += 10;
                    });

                    highPriorityWords.forEach(w => {
                        if (cleanKey.includes(w)) score += 50; // Super prioridad
                    });

                    avoidWords.forEach(w => {
                        if (cleanKey.includes(w)) score -= 100; // Huir de esta columna
                    });

                    if (score > bestScore && score > 0) {
                        bestScore = score;
                        bestKey = k;
                    }
                });
                return bestKey ? item[bestKey] : "";
            };

            let rawProyecto = String(getValue(['proyecto', 'urbanizacion', 'celina']) || "");
            let cleanProyecto = rawProyecto.toUpperCase().replace('CELINA ', '').replace('CELINA', '').trim();

            const cleanNumber = (val) => {
                if (val === undefined || val === null || val === "") return "";
                if (typeof val === 'number') return val;
                let strVal = String(val).replace(/[^0-9.,]/g, '');
                
                if (strVal.includes(',') && strVal.includes('.')) {
                    if (strVal.indexOf(',') > strVal.indexOf('.')) {
                        strVal = strVal.replace(/\./g, '').replace(',', '.'); // 1.234,56 -> 1234.56
                    } else {
                        strVal = strVal.replace(/,/g, ''); // 1,234.56 -> 1234.56
                    }
                } else if (strVal.includes(',')) {
                    strVal = strVal.replace(',', '.'); // 145,5 -> 145.5
                }
                
                const num = Number(strVal);
                return isNaN(num) ? "" : num;
            };

            return {
                proyecto: cleanProyecto,
                uv: String(getValue(['uv']) || "").toUpperCase().replace('UV:', '').trim(),
                mzn: String(getValue(['mzn', 'manzano']) || "").toUpperCase().replace('MZN:', '').trim(),
                lote: String(getValue(['lote']) || "").toUpperCase().replace('LOTE:', '').trim(),
                categoria: String(getValue(['categoria', 'cat']) || "Estándar"),
                superficie: cleanNumber(getValue(['superficie', 'sup', 'area'], ['m2', 'mt2'], ['precio', 'costo', 'valor'])),
                // Busca precio, le da prioridad a m2/mt2, e ignora precios totales o finales
                precio: cleanNumber(getValue(['precio', 'valor', 'costo'], ['m2', 'mt2', 'unitario', 'lista'], ['total', 'final', 'contado', 'credito'])) 
            };
          });

          const validLotes = normalizedData.filter(l => l.proyecto && l.lote);

          setLotesDB(validLotes);
          setDbError(null);
          console.log("Base de datos cargada y SANADA con éxito. Total:", validLotes.length);

        } catch (e) {
          throw new Error("ERROR_JSON");
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "ERROR_404") {
            setDbError("❌ Falta el archivo lotes.json en la carpeta 'public' de GitHub.");
          } else if (error.message === "ERROR_JSON") {
            setDbError("⚠️ El archivo lotes.json tiene un error de formato (JSON inválido).");
          } else if (error.message === "ENTORNO_VISTA_PREVIA" || error.name === "TypeError") {
            setDbError("⚠️ Entorno de previsualización. El modo inteligente se activará en Vercel.");
          } else {
            setDbError("❌ Error de red al conectar con la base de datos.");
          }
        }
        setLotesDB([]); 
      } finally {
        setLoading(false);
      }
    };

    fetchLotes();
  }, []);

  const proyectosDesdeDB = [...new Set(lotesDB.map(l => l.proyecto))].filter(Boolean).sort();
  const proyectosOptions = proyectosDesdeDB.length > 0 ? proyectosDesdeDB : ["MUYURINA", "SANTA FE", "EL RENACER", "LOS JARDINES", "CAÑAVERAL"];

  const [proyecto, setProyecto] = useState(proyectosOptions[0] || "MUYURINA");
  const [proyectoPersonalizado, setProyectoPersonalizado] = useState("");
  
  const [nombreCliente, setNombreCliente] = useState("");
  const [nombreAsesor, setNombreAsesor] = useState("");

  const [uv, setUv] = useState("");
  const [mzn, setMzn] = useState("");
  const [lote, setLote] = useState("");
  const [categoriaLote, setCategoriaLote] = useState("");
  const [superficie, setSuperficie] = useState("");
  const [precio, setPrecio] = useState("");
  
  const [descuentoCredito, setDescuentoCredito] = useState(20);
  const [descuentoContado, setDescuentoContado] = useState(30);
  const [descuentoM2, setDescuentoM2] = useState(0);
  const [descuentoInicial, setDescuentoInicial] = useState(0);
  const [descuentoContadoM2, setDescuentoContadoM2] = useState(0); 

  const [aplicarDescContadoPct, setAplicarDescContadoPct] = useState(true);
  const [aplicarDescCreditoPct, setAplicarDescCreditoPct] = useState(true);
  const [aplicarDescM2, setAplicarDescM2] = useState(true);
  const [aplicarDescContadoM2, setAplicarDescContadoM2] = useState(true);
  const [aplicarBonoInicialOtro, setAplicarBonoInicialOtro] = useState(true);

  const [modoInicial, setModoInicial] = useState("porcentaje"); 
  const [inicialPorcentaje, setInicialPorcentaje] = useState(""); 
  const [inicialMonto, setInicialMonto] = useState(""); 
  
  const [años, setAños] = useState("");
  const [resultado, setResultado] = useState(null);

  const [escenarioA, setEscenarioA] = useState(null);
  const [showComparativa, setShowComparativa] = useState(false);
  const [showTablaPagos, setShowTablaPagos] = useState(false);
  
  const [modoManual, setModoManual] = useState(false);
  const resultsRef = useRef(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
    setInicialPorcentaje(""); setInicialMonto(""); setAños("");
    setResultado(null); setProyectoPersonalizado(""); setEscenarioA(null); setShowTablaPagos(false);

    setAplicarDescContadoPct(true); setAplicarDescCreditoPct(true); setAplicarDescM2(true); setAplicarDescContadoM2(true); setAplicarBonoInicialOtro(true);

    if (proyecto === "MUYURINA" || proyecto === "SANTA FE") {
      setDescuentoCredito(20); setDescuentoContado(30); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
    } else if (proyecto === "EL RENACER" || proyecto === "LOS JARDINES") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(1); setDescuentoInicial(0); setDescuentoContadoM2(3);
    } else if (proyecto === "CAÑAVERAL") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(1); setDescuentoInicial(0); setDescuentoContadoM2(4);
    } else if (proyecto === "OTRO") {
      setDescuentoCredito(0); setDescuentoContado(0); setDescuentoM2(0); setDescuentoInicial(0); setDescuentoContadoM2(0);
      setModoManual(true);
    }

    if (proyecto !== "OTRO") {
      setModoManual(lotesDB.length === 0);
    }
  }, [proyecto, lotesDB.length]);

  // --- LÓGICA DE BÚSQUEDA INTELIGENTE EN CASCADA ---
  const uvsDisponibles = [...new Set(lotesDB.filter(l => l.proyecto === proyecto).map(l => l.uv))].sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  const mznsDisponibles = [...new Set(lotesDB.filter(l => l.proyecto === proyecto && String(l.uv) === String(uv)).map(l => l.mzn))].sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
  const lotesDisponibles = lotesDB.filter(l => l.proyecto === proyecto && String(l.uv) === String(uv) && String(l.mzn) === String(mzn)).sort((a,b) => String(a.lote).localeCompare(String(b.lote), undefined, {numeric: true}));

  const handleUvChange = (e) => {
    setUv(e.target.value);
    setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
  };

  const handleMznChange = (e) => {
    setMzn(e.target.value);
    setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
  };

  const handleLoteChange = (e) => {
    const selectedLote = e.target.value;
    setLote(selectedLote);
    const loteData = lotesDisponibles.find(l => String(l.lote) === String(selectedLote));
    if (loteData) {
      if (loteData.superficie) setSuperficie(loteData.superficie);
      if (loteData.precio) setPrecio(loteData.precio);
      setCategoriaLote(loteData.categoria || "Estándar"); 
    }
  };

  useEffect(() => {
    let pct = 0;
    if (modoInicial === 'porcentaje') {
      pct = Number(inicialPorcentaje);
    } else {
      const sup = Number(superficie); const prec = Number(precio); const monto = Number(inicialMonto);
      if (sup > 0 && prec > 0 && monto > 0) {
        const base = (sup * prec) - (sup * (aplicarDescM2 ? Number(descuentoM2) : 0));
        const finalBase = base - (base * (aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0));
        if (finalBase > 0) pct = (monto / finalBase) * 100;
      }
    }

    if (pct > 0) {
      if (proyecto === "MUYURINA" || proyecto === "SANTA FE") {
        if (pct >= 4.99) setDescuentoCredito(23); else setDescuentoCredito(20);
      } else if (["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto)) {
        if (pct >= 2.99) setDescuentoM2(2); else setDescuentoM2(1);
      }
    }
  }, [modoInicial, inicialPorcentaje, inicialMonto, superficie, precio, proyecto, descuentoM2, descuentoCredito, aplicarDescM2, aplicarDescCreditoPct]);

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  };

  const calcular = (e) => {
    if (e) e.preventDefault();
    
    const sup = Number(superficie); const prec = Number(precio); const ans = Number(años);
    const descCreditoPct = aplicarDescCreditoPct ? (Number(descuentoCredito) / 100) : 0;
    const descContadoPct = aplicarDescContadoPct ? (Number(descuentoContado) / 100) : 0;
    const descM2Val = aplicarDescM2 ? Number(descuentoM2) : 0;
    const descContadoM2Val = aplicarDescContadoM2 ? Number(descuentoContadoM2) : 0;

    if (!sup || !prec || ans <= 0) return setResultado(null);

    const valor_original = sup * prec;
    let monto_descuento_m2 = sup * descM2Val;
    const valor_post_desc_m2 = valor_original - monto_descuento_m2;
    const monto_desc_credito_pct = valor_post_desc_m2 * descCreditoPct;
    const base_para_inicial = valor_post_desc_m2 - monto_desc_credito_pct;
    
    let cuota_inicial = 0; let pct_inicial_real = 0;
    if (modoInicial === 'porcentaje') {
      pct_inicial_real = Number(inicialPorcentaje);
      cuota_inicial = base_para_inicial * (pct_inicial_real / 100);
    } else {
      cuota_inicial = Number(inicialMonto);
      pct_inicial_real = base_para_inicial > 0 ? (cuota_inicial / base_para_inicial) * 100 : 0;
    }

    let descIniVal = 0;
    if (proyecto === "OTRO" && aplicarBonoInicialOtro) descIniVal = Math.min(Number(descuentoInicial), 500);

    const monto_descuento_total_credito = monto_descuento_m2 + monto_desc_credito_pct + descIniVal;
    const valor_credito = valor_original - monto_descuento_total_credito;
    
    let monto_desc_contado_m2 = sup * descContadoM2Val;
    let monto_descuento_total_contado = 0;
    if (["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto)) {
      monto_descuento_total_contado = monto_desc_contado_m2 + (valor_original * descContadoPct);
    } else {
      monto_descuento_total_contado = monto_descuento_m2 + (valor_post_desc_m2 * descContadoPct) + monto_desc_contado_m2;
    }
    const valor_contado = valor_original - monto_descuento_total_contado;

    const saldo = valor_credito - cuota_inicial;
    const meses = ans * 12;
    const tasa_anual = 0.121733; const tasa = tasa_anual / 12;

    const refSaldo = 34278.00;
    const baseSeguro = { 1: 16.32, 2: 17.30, 3: 18.31, 4: 19.36, 5: 20.44, 6: 21.56, 7: 22.71, 8: 23.90, 9: 25.12, 10: 26.38 };
    
    let pago_puro = tasa === 0 ? (saldo / meses) : (saldo * (tasa * Math.pow(1 + tasa, meses)) / (Math.pow(1 + tasa, meses) - 1));
    const factorSeguro = baseSeguro[ans] ? (baseSeguro[ans] / refSaldo) : (26.38 + (ans - 10) * 1) / refSaldo;
    const seguro = saldo * factorSeguro;
    const cbdi = 0; 
    const cuota_final = pago_puro + seguro + cbdi;
    const total_pagado_credito = cuota_inicial + (cuota_final * meses);

    const tablaPlazos = [];
    for (let i = 10; i >= 1; i--) {
        const m = i * 12;
        let p_puro_i = tasa === 0 ? (saldo / m) : (saldo * (tasa * Math.pow(1 + tasa, m)) / (Math.pow(1 + tasa, m) - 1));
        const fSeguro_i = baseSeguro[i] ? (baseSeguro[i] / refSaldo) : (26.38 / refSaldo);
        const seg_i = saldo * fSeguro_i;
        const c_final_i = p_puro_i + seg_i + cbdi;
        tablaPlazos.push({ años: i, meses: m, cuota_inicial: formatMoney(cuota_inicial), cuota_mensual: formatMoney(c_final_i) });
    }

    const TIPO_CAMBIO = 6.97;
    const nombreProyectoFinal = proyecto === "OTRO" ? proyectoPersonalizado : proyecto;

    setResultado({
      proyecto: nombreProyectoFinal, uv, mzn, lote, superficie: sup, precioM2: prec,
      categoria: categoriaLote || "Estándar",
      cliente: nombreCliente || 'Cliente Preferencial', asesor: nombreAsesor,
      
      valorOriginal: formatMoney(valor_original), valorOriginalBs: formatMoney(valor_original * TIPO_CAMBIO),
      valorContado: formatMoney(valor_contado), valorContadoBs: formatMoney(valor_contado * TIPO_CAMBIO),
      ahorroContado: formatMoney(monto_descuento_total_contado),
      porcentajeContado: aplicarDescContadoPct ? descuentoContado : 0, descuentoContadoM2: aplicarDescContadoM2 ? descContadoM2Val : 0,
      
      valorCreditoRaw: valor_credito, inicialRaw: cuota_inicial, mensualRaw: cuota_final, mensualBsRaw: cuota_final * TIPO_CAMBIO,
      saldoFinanciarRaw: saldo, totalPagadoCreditoRaw: total_pagado_credito,

      valorCreditoBs: formatMoney(valor_credito * TIPO_CAMBIO),
      ahorroCredito: formatMoney(monto_descuento_total_credito),
      porcentajeCredito: aplicarDescCreditoPct ? descuentoCredito : 0,
      descuentoM2: aplicarDescM2 ? descM2Val : 0, descuentoInicial: descIniVal,
      
      inicialBs: formatMoney(cuota_inicial * TIPO_CAMBIO), inicial: formatMoney(cuota_inicial),
      pagoAmortizacion: formatMoney(pago_puro), pagoAmortizacionRaw: pago_puro,
      seguro: formatMoney(seguro), seguroRaw: seguro, cbdi: formatMoney(cbdi), cbdiRaw: cbdi,
      plazo: ans, meses: meses, pctInicial: parseFloat(pct_inicial_real.toFixed(2)),
      mensual: formatMoney(cuota_final), mensualBs: formatMoney(cuota_final * TIPO_CAMBIO),
      tablaPlazos: tablaPlazos
    });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const generarMensajeParte1 = () => {
    if (!resultado) return "";
    return `Estimado(a) *${resultado.cliente}*, un gusto saludarle. Soy ${resultado.asesor || 'su Asesor Comercial'}.\n\n` +
           `🌱 _"Las cosas grandes, comienzan con un inicio pequeño"_.\nEsta frase de nuestro fundador, Rafael Paz, define exactamente lo que representa este paso: un terreno es el inicio seguro para el gran sueño de su familia.\n\n` +
           `🏆 Al invertir con *CELINA*, usted cuenta con el respaldo absoluto del *GRUPO PAZ*, reconocido este 2026 como una de las *5 Mejores Empresas para Trabajar en toda Bolivia*. Le garantizamos la mayor seguridad, legalidad y plusvalía del país para su inversión.`;
  };

  const generarMensajeParte2 = () => {
    if (!resultado) return "";
    const inicio = `Me enorgullece presentarle su propuesta oficial:\n\n`;
    const nombreProyectoCapitalizado = resultado.proyecto.charAt(0).toUpperCase() + resultado.proyecto.slice(1).toLowerCase();
    
    const ubicacion = `📍 *PROYECTO ${nombreProyectoCapitalizado || 'S/N'}*\n🏷️ Categoría: ${resultado.categoria}\nUV ${resultado.uv || '-'} | MZN ${resultado.mzn || '-'} | Lote ${resultado.lote || '-'} (${resultado.superficie} m²)\n\n`;
    
    const precioLista = `💎 *Precio de Lista Original:* $ ${resultado.valorOriginal} (Bs. ${resultado.valorOriginalBs})\n\n`;
    
    let arrContado = [];
    if (resultado.porcentajeContado > 0) arrContado.push(`${resultado.porcentajeContado}%`);
    let isProyectosEspeciales = ["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(resultado.proyecto.toUpperCase());
    let descM2ContadoVal = isProyectosEspeciales ? Number(resultado.descuentoContadoM2 || 0) : Number(resultado.descuentoM2 || 0) + Number(resultado.descuentoContadoM2 || 0);
    if (descM2ContadoVal > 0) arrContado.push(`$${descM2ContadoVal}/m²`);

    let contadoStr = "";
    if (arrContado.length > 0) {
        contadoStr = `💰 *Opción 1: Al Contado - ¡Con ${arrContado.join(' + ')} de descuento!*\n*Inversión Final:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n`;
    } else {
        contadoStr = `💰 *Opción 1: Al Contado*\n*Inversión Final:* $${resultado.valorContado} (Bs. ${resultado.valorContadoBs})\n\n`;
    }

    let arrCredito = [];
    if (resultado.porcentajeCredito > 0) arrCredito.push(`${resultado.porcentajeCredito}%`);
    if (resultado.descuentoM2 > 0) arrCredito.push(`$${resultado.descuentoM2}/m²`);
    
    let creditoStr = "";
    if (arrCredito.length > 0) {
        creditoStr = `✅ *Opción 2: A Plazos - ¡Con ${arrCredito.join(' + ')} de descuento!*\n*Total a Financiar:* $ ${formatMoney(resultado.valorCreditoRaw)} (Bs. ${resultado.valorCreditoBs})\n\n`;
    } else {
        creditoStr = `✅ *Opción 2: A Plazos*\n*Total a Financiar:* $ ${formatMoney(resultado.valorCreditoRaw)} (Bs. ${resultado.valorCreditoBs})\n\n`;
    }

    const financiamiento = `📊 *Plan de Financiamiento* (${resultado.plazo} años)\n` +
      `*Cuota inicial (${resultado.pctInicial}%):* $${formatMoney(resultado.inicialRaw)} (Bs. ${resultado.inicialBs})\n` +
      `*Cuota mensual fija:* $${formatMoney(resultado.mensualRaw)} (Bs. ${formatMoney(resultado.mensualBsRaw)})\n\n`;

    const cierre = `¿Le gustaría agendar una visita al terreno para dar ese "pequeño inicio" hacia su gran proyecto? Quedo a su entera disposición. 🤝`;
    
    return inicio + ubicacion + precioLista + contadoStr + creditoStr + financiamiento + cierre;
  };

  const enviarWhatsAppParte1 = () => {
    const mensaje = generarMensajeParte1();
    if (!mensaje) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const enviarWhatsAppParte2 = () => {
    const mensaje = generarMensajeParte2();
    if (!mensaje) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  const copiarTextoTodo = () => {
    const mensaje = generarMensajeParte1() + "\n\n" + generarMensajeParte2();
    if (!mensaje) return;

    const textArea = document.createElement("textarea");
    textArea.value = mensaje;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('No se pudo copiar', err);
    }
    document.body.removeChild(textArea);
  };

  const handleReset = () => {
    setResultado(null);
    setEscenarioA(null);
    setShowComparativa(false);
    setShowTablaPagos(false);
    setUv(""); setMzn(""); setLote(""); setSuperficie(""); setPrecio(""); setCategoriaLote("");
    setAños(""); setInicialMonto(""); setInicialPorcentaje("");
    setNombreCliente("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showDescPorcentaje = ["MUYURINA", "SANTA FE", "OTRO"].includes(proyecto);
  const showDescM2 = ["EL RENACER", "LOS JARDINES", "CAÑAVERAL", "OTRO"].includes(proyecto);
  const showBonoInicial = ["OTRO"].includes(proyecto);
  const showDescContadoM2 = ["LOS JARDINES", "CAÑAVERAL", "EL RENACER"].includes(proyecto);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1121] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-white font-bold tracking-widest uppercase text-xs">Optimizando Base de Datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1121] relative font-['Plus_Jakarta_Sans'] text-slate-300 overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-100">
      
      <style dangerouslySetInnerHTML={{ __html: `
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0B1121; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        .glass-panel-left {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          box-shadow: 0 0 30px -5px rgba(6, 182, 212, 0.15), inset 0 0 20px -5px rgba(6, 182, 212, 0.05);
        }
        .glass-panel-right {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(51, 65, 85, 0.5);
          box-shadow: 0 0 30px -5px rgba(52, 211, 153, 0.1), inset 0 0 20px -5px rgba(52, 211, 153, 0.05);
        }
        .glass-input {
          background: rgba(11, 17, 33, 0.6);
          border: 1px solid rgba(51, 65, 85, 0.8);
          color: #e2e8f0;
          transition: all 0.3s ease;
        }
        .glass-input:focus {
          background: rgba(15, 23, 42, 0.8);
          border-color: #06b6d4;
          box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2), inset 0 2px 4px 0 rgba(0, 0, 0, 0.2);
          outline: none;
        }
        .glass-input::placeholder { color: #475569; }
      `}} />

      {/* FONDO GLOBAL OSCURO CON LA IMAGEN AÉREA */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <img src="/image_9f6ffd.jpg" className="absolute inset-0 w-full h-full object-cover opacity-[0.15] filter blur-[6px] scale-105" alt="Background" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B1121]/80 via-[#0B1121]/90 to-[#0B1121]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-900/20 rounded-full mix-blend-screen filter blur-[100px]"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[35rem] h-[35rem] bg-emerald-900/20 rounded-full mix-blend-screen filter blur-[100px]"></div>
      </div>

      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-screen relative z-20 px-4 bg-[#0B1121]/95 backdrop-blur-xl">
          <div className="bg-[#121A2F] border border-slate-700/30 rounded-[2.5rem] p-10 sm:p-14 max-w-[420px] w-full relative overflow-hidden text-center shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
            
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-blue-500/10 rounded-full blur-[50px] pointer-events-none"></div>

            <div className="w-[4.5rem] h-[4.5rem] mx-auto bg-gradient-to-b from-[#38bdf8] to-[#2563eb] rounded-[1.25rem] flex items-center justify-center mb-6 shadow-[0_10px_30px_rgba(56,189,248,0.4)]">
              <Lock className="w-8 h-8 text-white" strokeWidth={2} />
            </div>

            <h1 className="text-3xl sm:text-[2rem] font-extrabold text-white tracking-tight mb-2 drop-shadow-md">Acceso VIP</h1>
            <p className="text-slate-400/80 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] mb-10 leading-relaxed">
              Uso Exclusivo Máquina de<br />Ventas
            </p>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <input 
                  type="password" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  placeholder="CONTRASEÑA" 
                  className="w-full bg-[#0B1120] border border-slate-700/50 rounded-2xl p-4 text-center text-sm tracking-[0.2em] font-bold text-white placeholder:text-slate-600 focus:border-[#38bdf8] focus:ring-1 focus:ring-[#38bdf8] transition-all outline-none shadow-inner" 
                />
                {loginError && <p className="text-rose-400 text-xs font-bold mt-3 animate-pulse">{loginError}</p>}
              </div>
              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-[#38bdf8] to-[#2563eb] hover:from-[#0ea5e9] hover:to-[#1d4ed8] text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 shadow-[0_10px_25px_rgba(56,189,248,0.4)] hover:shadow-[0_15px_35px_rgba(56,189,248,0.6)] hover:-translate-y-1 uppercase tracking-widest text-sm flex items-center justify-center gap-2 group"
              >
                INGRESAR <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
        </div>
      ) : (
      <div className="max-w-[1200px] mx-auto py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* CABECERA CORPORATIVA DARK */}
        <div className="flex flex-col items-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E293B]/50 border border-slate-700/50 shadow-sm backdrop-blur-sm mb-5">
             <Activity className="w-4 h-4 text-cyan-400" />
             <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-100">Plataforma de Cierres V2</span>
          </div>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
               <Building2 className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Cotizador <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Pro</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm font-medium tracking-wide">Diseñado por Oscar Saravia®</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          
          {/* --- PANEL IZQUIERDO: FORMULARIO DARK GLASS --- */}
          <div className="lg:col-span-5 glass-panel-left rounded-[2.5rem] overflow-hidden transition-all duration-500 relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
            
            <div className="p-6 sm:p-8 border-b border-slate-700/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#1E293B] p-2.5 rounded-xl border border-slate-600/50 shadow-inner">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h2 className="text-lg font-bold tracking-wide text-white">Datos de Inversión</h2>
              </div>
              
              <button 
                type="button" 
                onClick={handleReset} 
                className="p-2.5 bg-[#0F172A] hover:bg-[#1e293b] rounded-xl border border-slate-700/80 text-slate-400 hover:text-cyan-400 transition-colors shadow-sm group" 
                title="Limpiar Cotización"
              >
                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
            
            <div className="p-6 sm:p-8 bg-[#0F172A]/40">
              <form onSubmit={calcular} className="space-y-6">
                
                {/* DATOS DEL CLIENTE */}
                <div className="space-y-4 bg-[#1E293B]/30 p-5 rounded-2xl border border-cyan-900/30">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <UserCircle className="w-3.5 h-3.5 text-cyan-500" /> Nombre del Cliente (Opcional)
                    </label>
                    <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} placeholder="Ej. Juan Pérez" className="w-full glass-input rounded-xl p-3 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <BadgeCheck className="w-3.5 h-3.5 text-cyan-500" /> Nombre del Asesor
                    </label>
                    <input type="text" value={nombreAsesor} onChange={e => setNombreAsesor(e.target.value)} placeholder="Tu Nombre Completo" className="w-full glass-input rounded-xl p-3 text-sm" />
                  </div>
                </div>

                {/* MENSAJE DE DIAGNÓSTICO DE BASE DE DATOS */}
                {dbError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-center text-center shadow-inner animate-in fade-in">
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">{dbError}</span>
                  </div>
                )}

                {/* PROYECTO Y MODO */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-500" /> Proyecto
                    </label>
                    {proyecto !== "OTRO" && lotesDB.length > 0 && (
                      <button 
                        type="button" 
                        onClick={() => setModoManual(!modoManual)} 
                        className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 transition-all border ${modoManual ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-cyan-900/30 text-cyan-400 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'}`}
                      >
                        {modoManual ? (
                          <span className="flex items-center gap-1.5"><Edit3 className="w-3 h-3"/> {'Ingreso Manual'}</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><Database className="w-3 h-3"/> {'Búsqueda Inteligente'}</span>
                        )}
                      </button>
                    )}
                  </div>
                  <select value={proyecto} onChange={e => setProyecto(e.target.value)} className="w-full glass-input rounded-2xl p-4 font-bold text-white text-base cursor-pointer">
                    {proyectosOptions.map(p => (
                       <option key={p} value={p}>{p}</option>
                    ))}
                    <option value="OTRO">OTRO...</option>
                  </select>
                  {proyecto === "OTRO" && (
                    <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                      <input 
                        type="text" 
                        value={proyectoPersonalizado} 
                        onChange={e => setProyectoPersonalizado(e.target.value)} 
                        placeholder="Nombre del nuevo proyecto..." 
                        className="w-full glass-input rounded-2xl p-4 text-sm font-bold text-white shadow-inner"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* UV / MZN / LOTE (Dinámico según Modo) */}
                {!modoManual && proyecto !== "OTRO" && lotesDB.length > 0 ? (
                  <div className="bg-cyan-900/10 p-4 rounded-2xl border border-cyan-500/30 grid grid-cols-3 gap-3 shadow-inner animate-in fade-in">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest text-center block">Elegir UV</label>
                      <select value={uv} onChange={handleUvChange} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2.5 text-center font-bold text-white outline-none focus:border-cyan-400 text-sm">
                        <option value="" disabled hidden>---</option>
                        {uvsDisponibles.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest text-center block">Elegir MZN</label>
                      <select value={mzn} onChange={handleMznChange} disabled={!uv} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2.5 text-center font-bold text-white outline-none focus:border-cyan-400 disabled:opacity-50 text-sm">
                        <option value="" disabled hidden>---</option>
                        {mznsDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-cyan-400 uppercase tracking-widest text-center block">Elegir LOTE</label>
                      <select value={lote} onChange={handleLoteChange} disabled={!mzn} className="w-full bg-[#0F172A] border border-cyan-900/50 rounded-xl p-2.5 text-center font-bold text-white outline-none focus:border-cyan-400 disabled:opacity-50 text-sm">
                        <option value="" disabled hidden>---</option>
                        {lotesDisponibles.map(l => <option key={l.lote} value={l.lote}>{l.lote}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1E293B]/30 p-3 rounded-2xl border border-slate-700/50 flex justify-between gap-3 animate-in fade-in">
                    <div className="space-y-1.5 text-center w-full">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">UV</label>
                      <input type="text" value={uv} onChange={e => setUv(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 transition-colors pb-1" />
                    </div>
                    <div className="w-px bg-slate-700/50"></div>
                    <div className="space-y-1.5 text-center w-full">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">MZN</label>
                      <input type="text" value={mzn} onChange={e => setMzn(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 transition-colors pb-1" />
                    </div>
                    <div className="w-px bg-slate-700/50"></div>
                    <div className="space-y-1.5 text-center w-full">
                      <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">LOTE</label>
                      <input type="text" value={lote} onChange={e => setLote(e.target.value)} placeholder="Opc" className="w-full bg-transparent text-center font-bold text-white outline-none border-b border-transparent focus:border-cyan-500 transition-colors pb-1" />
                    </div>
                  </div>
                )}

                {/* CATEGORÍA DEL LOTE (Si existe) */}
                {!modoManual && proyecto !== "OTRO" && categoriaLote && (
                  <div className="bg-[#1E293B]/60 border border-cyan-900/50 p-3 rounded-xl flex items-center gap-2 mt-2 mb-4 animate-in fade-in slide-in-from-top-2">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      Categoría: <span className="text-white">{categoriaLote}</span>
                    </span>
                  </div>
                )}

                {/* SUP & PRECIO - CON CANDADO EN BÚSQUEDA INTELIGENTE */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Map className="w-4 h-4 text-emerald-400" /> Superficie (m²)</label>
                    <input 
                      type="number" 
                      required 
                      value={superficie} 
                      onChange={e => setSuperficie(e.target.value)} 
                      placeholder="Ej. 240" 
                      readOnly={!modoManual && proyecto !== "OTRO" && lotesDB.length > 0}
                      className={`w-full glass-input rounded-2xl p-4 font-extrabold text-white text-lg transition-colors ${!modoManual && proyecto !== "OTRO" && lotesDB.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 outline-none focus:border-emerald-500/30 focus:shadow-none cursor-default' : 'focus:bg-emerald-900/20'}`} 
                    />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-400" /> Precio / m²</label>
                    <input 
                      type="number" 
                      required 
                      value={precio} 
                      onChange={e => setPrecio(e.target.value)} 
                      placeholder="Ej. 145" 
                      readOnly={!modoManual && proyecto !== "OTRO" && lotesDB.length > 0}
                      className={`w-full glass-input rounded-2xl p-4 font-extrabold text-white text-lg transition-colors ${!modoManual && proyecto !== "OTRO" && lotesDB.length > 0 ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 outline-none focus:border-emerald-500/30 focus:shadow-none cursor-default' : 'focus:bg-emerald-900/20'}`} 
                    />
                  </div>
                </div>

                {/* DESCUENTOS */}
                <div className="bg-[#1E293B]/40 border border-slate-700 p-5 rounded-[2rem] relative overflow-hidden">
                  <div className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Gift className="w-4 h-4" /> Descuentos Promocionales</div>
                  <div className="grid grid-cols-2 gap-4">
                    {showDescPorcentaje && (
                      <React.Fragment>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescContadoPct} onChange={e => setAplicarDescContadoPct(e.target.checked)} className="accent-emerald-500" /> A Contado (%)</label>
                          <input type="number" step="0.01" disabled={!aplicarDescContadoPct} value={descuentoContado} onChange={e=>setDescuentoContado(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescCreditoPct} onChange={e => setAplicarDescCreditoPct(e.target.checked)} className="accent-emerald-500" /> A Crédito (%)</label>
                          <input type="number" step="0.01" disabled={!aplicarDescCreditoPct} value={descuentoCredito} onChange={e=>setDescuentoCredito(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" />
                        </div>
                      </React.Fragment>
                    )}
                    {showDescM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescM2} onChange={e => setAplicarDescM2(e.target.checked)} className="accent-emerald-500" /> Crédito x m² ($us)</label>
                        <input type="number" step="0.01" disabled={!aplicarDescM2} value={descuentoM2} onChange={e=>setDescuentoM2(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" />
                      </div>
                    )}
                    {showDescContadoM2 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><input type="checkbox" checked={aplicarDescContadoM2} onChange={e => setAplicarDescContadoM2(e.target.checked)} className="accent-emerald-500" /> Contado x m² ($us)</label>
                        <input type="number" step="0.01" disabled={!aplicarDescContadoM2} value={descuentoContadoM2} onChange={e=>setDescuentoContadoM2(e.target.value)} className="w-full glass-input rounded-xl p-3 font-bold text-sm" />
                      </div>
                    )}
                  </div>
                </div>

                {/* INICIAL & PLAZO */}
                <div className="grid grid-cols-12 gap-5 mt-4">
                  <div className="col-span-12 md:col-span-8 bg-[#1E293B]/40 border border-slate-700 p-4 rounded-2xl grid grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest"><Percent className="w-3.5 h-3.5 inline mr-1"/> Inicial (%)</label><input type="number" step="0.01" value={modoInicial === 'porcentaje' ? inicialPorcentaje : ''} onChange={(e) => { setModoInicial('porcentaje'); setInicialPorcentaje(e.target.value); }} className="w-full glass-input rounded-xl p-3 font-bold text-white" /></div>
                    <div className="space-y-2"><label className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-widest"><DollarSign className="w-3.5 h-3.5 inline mr-1"/> Monto ($us)</label><input type="number" step="0.01" value={modoInicial === 'monto' ? inicialMonto : ''} onChange={(e) => { setModoInicial('monto'); setInicialMonto(e.target.value); }} className="w-full glass-input rounded-xl p-3 font-bold text-white" /></div>
                  </div>
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest"><Calendar className="w-4 h-4 inline text-cyan-500 mr-1"/> Plazo</label>
                    <select required value={años} onChange={e => setAños(e.target.value)} className="w-full glass-input rounded-2xl p-3.5 font-bold text-white appearance-none h-11">
                      <option value="" disabled hidden>Selec.</option>
                      {[...Array(10)].map((_, i) => (<option key={i + 1} value={i + 1}>{i + 1} {i === 0 ? 'Año' : 'Años'}</option>))}
                    </select>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-8 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-extrabold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] uppercase tracking-widest text-sm"
                >
                  Procesar Cotización <TrendingUp className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>

          {/* --- PANEL DERECHO: RESULTADOS DARK --- */}
          <div className="lg:col-span-7 flex flex-col gap-6" ref={resultsRef}>
            {!resultado ? (
              <div className="glass-panel-right rounded-[2.5rem] h-full min-h-[600px] flex flex-col items-center justify-center text-slate-500 p-10 text-center relative overflow-hidden">
                <div className="relative z-10"><div className="bg-[#1E293B] p-8 rounded-full mb-8 shadow-xl border border-slate-700 shadow-emerald-500/5"><Calculator className="w-16 h-16 text-emerald-500 opacity-50" /></div></div>
                <h3 className="text-3xl font-bold text-slate-300 tracking-tight mb-3 relative z-10">Plataforma Activa</h3>
                <p className="text-sm font-medium relative z-10 max-w-sm">Completa los parámetros de inversión a la izquierda para generar la propuesta oficial.</p>
              </div>
            ) : (
              <div className="glass-panel-right rounded-[2.5rem] p-7 sm:p-10 relative overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 to-transparent"></div>

                {/* CABECERA RESULTADOS */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4 relative z-10">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-3 tracking-tight">
                    <div className="bg-[#1E293B] border border-emerald-500/30 p-2 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                      <ShieldCheck className="w-6 h-6 text-emerald-400" />
                    </div>
                    Propuesta Oficial
                  </h2>
                  <span className="bg-emerald-500 text-slate-900 text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest flex items-center gap-2 shadow-[0_0_20px_rgba(52,211,153,0.4)]">
                    <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse"></span> APROBADA
                  </span>
                </div>
                
                <div className="relative z-10 space-y-5">
                  
                  {/* Proyecto / Lote */}
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-4 pl-2">
                      <div className="bg-[#0F172A] p-3 rounded-xl border border-slate-700"><MapPin className="w-5 h-5 text-slate-400" /></div>
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Proyecto</div>
                        <div className="text-white font-black text-lg uppercase tracking-tight">{resultado.proyecto}</div>
                        {resultado.categoria && resultado.categoria !== "Estándar" && (
                          <div className="text-cyan-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">{resultado.categoria}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">UV</div><div className="text-slate-300 font-bold text-sm">{resultado.uv || 'N/A'}</div></div>
                      <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">MZN</div><div className="text-slate-300 font-bold text-sm">{resultado.mzn || 'N/A'}</div></div>
                      <div className="text-center px-4 py-2 bg-[#0F172A] rounded-xl border border-slate-700"><div className="text-[8px] font-extrabold text-slate-500 uppercase">LOTE</div><div className="text-white font-black text-sm">{resultado.lote || 'N/A'}</div></div>
                    </div>
                  </div>

                  {/* Contado vs Lista Top */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-[#1E293B]/40 p-6 rounded-2xl border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Precio de Lista Original</span>
                      <div className="text-3xl font-black text-white mt-1">$ {resultado.valorOriginal}</div>
                    </div>

                    <div className="bg-emerald-500/10 p-6 rounded-2xl border border-emerald-500/30 shadow-[inset_0_0_20px_rgba(52,211,153,0.05)] relative overflow-hidden flex flex-col justify-center">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -z-10"></div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1 flex items-center gap-1.5"><Tag className="w-3 h-3"/> Oferta al Contado</div>
                      <div className="text-3xl font-black text-emerald-400 tracking-tight">$ {resultado.valorContado}</div>
                    </div>
                  </div>

                  {/* Financiamiento Cards */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="bg-[#1E293B]/40 p-6 rounded-2xl border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total a Financiar</span>
                      <div className="text-2xl font-black text-white mt-1">$ <AnimatedNumber value={resultado.valorCreditoRaw} /></div>
                    </div>
                    <div className="bg-[#1E293B]/40 p-6 rounded-2xl border border-slate-700/50">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Cuota Inicial ({resultado.pctInicial}%)</span>
                      <div className="text-2xl font-black text-white mt-1">$ <AnimatedNumber value={resultado.inicialRaw} /></div>
                    </div>
                  </div>

                  {/* VIP Mensual Card DARK */}
                  <div className="relative overflow-hidden bg-[#0F172A] p-8 sm:p-10 rounded-[2rem] border border-slate-700 shadow-inner">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-900/10 to-transparent pointer-events-none"></div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
                    
                    <span className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest relative z-10 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse"></div> 
                      Cuota Mensual Fija ({resultado.plazo} Años)
                    </span>
                    
                    <div className="mt-4 relative z-10">
                      <div className="text-6xl sm:text-7xl font-black text-white tracking-tighter drop-shadow-md">
                        $ <AnimatedNumber value={resultado.mensualRaw} />
                      </div>
                      <div className="text-xl font-bold text-cyan-200/50 mt-1">
                        Bs. <AnimatedNumber value={resultado.mensualBsRaw} />
                      </div>
                    </div>
                    
                    <div className="text-[10px] text-slate-500 mt-6 font-medium flex gap-4 border-t border-slate-800 pt-4 relative z-10 uppercase tracking-wider">
                      <span>Amort. ${resultado.pagoAmortizacion}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700 my-auto"></span>
                      <span>Seguro ${resultado.seguro}</span>
                      <span className="w-1 h-1 rounded-full bg-slate-700 my-auto"></span>
                      <span>CBDI ${resultado.cbdi}</span>
                    </div>
                  </div>

                  {/* COMPARATIVA A/B - ALERTA DARK */}
                  {showComparativa && escenarioA && (
                    <div className="bg-[#1E293B] border border-cyan-900/50 rounded-2xl p-5 shadow-inner animate-in slide-in-from-top-4">
                      <div className="flex justify-between items-center mb-4"><h4 className="font-bold text-cyan-400 flex items-center gap-2 text-sm"><Scale className="w-4 h-4"/> Comparativa de Escenarios</h4><button onClick={()=>setShowComparativa(false)}><X className="w-4 h-4 text-slate-500 hover:text-slate-300"/></button></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0F172A] p-4 rounded-xl border border-slate-700/50">
                          <div className="text-[9px] font-bold text-slate-500 uppercase">Escenario (A)</div>
                          <div className="font-black text-base text-white mt-1">{escenarioA.plazo} Años | Inicial {escenarioA.pctInicial}%</div>
                          <div className="text-xs font-bold text-slate-300 mt-1">Mensual: ${escenarioA.mensual}</div>
                        </div>
                        <div className="bg-[#0F172A] p-4 rounded-xl border border-cyan-500/30 shadow-[inset_0_0_10px_rgba(6,182,212,0.05)]">
                          <div className="text-[9px] font-bold text-cyan-500 uppercase">Escenario Actual (B)</div>
                          <div className="font-black text-base text-white mt-1">{resultado.plazo} Años | Inicial {resultado.pctInicial}%</div>
                          <div className="text-xs font-bold text-cyan-400 mt-1">Mensual: ${resultado.mensual}</div>
                        </div>
                      </div>
                      {escenarioA.totalPagadoCreditoRaw > resultado.totalPagadoCreditoRaw ? (
                        <div className="mt-3 text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5"/> El Cliente Ahorra ${formatMoney(escenarioA.totalPagadoCreditoRaw - resultado.totalPagadoCreditoRaw)} en el (B)
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* ACCIONES KILLER DARK CON DOS BOTONES PARA WHATSAPP */}
                  <div className="flex flex-col gap-3 mt-8">
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={enviarWhatsAppParte1} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.2)] flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest transition-all">
                        <MessageSquareText className="w-4 h-4"/> {'1️⃣ Enviar Intro'}
                      </button>
                      <button onClick={enviarWhatsAppParte2} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold py-3.5 rounded-xl shadow-[0_0_15px_rgba(52,211,153,0.2)] flex items-center justify-center gap-2 text-[11px] uppercase tracking-widest transition-all">
                        <Send className="w-4 h-4"/> {'2️⃣ Enviar Cotización'}
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button onClick={copiarTextoTodo} className="col-span-1 bg-[#1E293B] hover:bg-[#2A374F] border border-cyan-900/50 text-cyan-400 font-bold py-3.5 rounded-xl shadow-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all">
                        {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {isCopied ? "Copiado!" : "Copiar Todo"}
                      </button>
                      {!escenarioA ? (
                         <button onClick={()=>{setEscenarioA(resultado); setShowComparativa(true);}} className="col-span-2 bg-[#1E293B] hover:bg-[#2A374F] border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-colors"><Scale className="w-4 h-4"/> Guardar Escenario A</button>
                      ) : (
                         <button onClick={()=>setShowComparativa(true)} className="col-span-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-400 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-colors"><Scale className="w-4 h-4"/> Comparar (A) vs (B)</button>
                      )}
                    </div>

                    <button onClick={()=>setShowTablaPagos(!showTablaPagos)} className="w-full bg-[#1E293B] hover:bg-[#2A374F] border border-slate-700 text-slate-300 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs uppercase tracking-wider transition-colors mt-1"><TableProperties className="w-4 h-4"/> Ver Plan de Pagos Completo</button>
                  </div>

                  {/* TABLA DE PLAN DE PAGOS DARK */}
                  {showTablaPagos && (
                    <div className="mt-4 bg-[#0F172A] rounded-2xl border border-slate-700 overflow-hidden animate-in slide-in-from-top-4">
                      <div className="bg-[#1E293B] p-4 border-b border-slate-700">
                        <h4 className="font-bold text-slate-300 text-xs tracking-widest uppercase">Tabla de Amortización</h4>
                      </div>
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#0F172A] text-slate-500 uppercase font-bold">
                          <tr>
                            <th className="px-4 py-3 text-center border-b border-slate-800">Año</th>
                            <th className="px-4 py-3 text-center border-b border-slate-800">Meses</th>
                            <th className="px-4 py-3 text-center border-b border-slate-800">Inicial</th>
                            <th className="px-4 py-3 text-center border-b border-slate-800">Mensual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.tablaPlazos.map((row, i) => (
                               <tr key={i} className={`border-b border-slate-800/50 hover:bg-[#1E293B]/50 transition-colors ${row.años === resultado.plazo ? 'bg-cyan-900/10 border-l-2 border-l-cyan-500' : ''}`}>
                                 <td className="px-4 py-3 font-bold text-slate-300 text-center">{row.años}</td>
                                 <td className="px-4 py-3 text-center text-slate-500">{row.meses}</td>
                                 <td className="px-4 py-3 text-center text-slate-500">{row.cuota_inicial}</td>
                                 <td className="px-4 py-3 font-black text-cyan-400 text-center">{row.cuota_mensual}</td>
                               </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
