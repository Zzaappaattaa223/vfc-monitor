# VFC Monitor 🌿

> **Monitoreo de Variabilidad de la Frecuencia Cardíaca (VFC / HRV) y Cardiotacograma en Tiempo Real para Celulares Android.**  
> Diseñado bajo la metodología **EGM (Elephant-Goldfish Model)** y el estándar de diseño **Impeccable** (*OLED Obsidian & Sage*).  
> Adquisición óptica adaptativa para cualquier zona anatómica · Interpolación sub-fotograma $<2\text{ ms}$ · Cero servidores.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 🌟 Características Principales

- **Adquisición Óptica Universal:** Funciona en la yema del dedo, lóbulo de la oreja, arteria carótida (cuello), muñeca, sienes o rostro (rPPG frontal sin contacto).
- **Control de Ganancia Automático (AGC):** Amplifica dinámicamente micro-pulsaciones en zonas de baja perfusión donde la amplitud pulsátil representa menos del $0.2\%$ del brillo DC.
- **Conmutación Espectral Dinámica:** Evalúa en tiempo real si el canal Rojo, Verde o diferencial CHROM ofrece la mayor relación señal-ruido (SNR) y conmuta automáticamente.
- **Resolución Temporal Sub-Fotograma ($<2\text{ ms}$):** Supera la barrera de los 30 FPS (~33.3 ms) de las cámaras web de celular mediante un ajuste parabólico cuadrático en el ápice sistólico de la onda de pulso.
- **Semáforo SQI & Sugerencias Inteligentes:** Detecta presión excesiva, saturación lumínica o movimiento brusco, pausando el tacograma preventivamente para evitar registrar latidos falsos.
- **Cardiotacograma en Tiempo Real:** Proyección en Canvas a 60 FPS de los intervalos RR en milisegundos con oscilación rítmica por Arritmia Sinusal Respiratoria (RSA).
- **Gráfico de Dispersión de Poincaré:** Representación $RR_n$ vs $RR_{n+1}$ con elipsoide dinámico ($SD1 \times SD2$) que evidencia visualmente la activación vagal durante el masaje.
- **Índice Parasimpático Unificado (0-100):** Escala intuitiva con desglose técnico ($RMSSD, SDNN, pNN50, SD1, SD2$).
- **Comparativa Pre vs. Post Masaje:** Registro de línea de base inicial de 60s y contraste al finalizar la sesión con cálculo del Delta de activación vagal.
- **Wake Lock API Integrada:** Mantiene la pantalla encendida sin oscurecimiento durante las sesiones de masaje.

---

## 🚀 Despliegue en Vercel (1 Clic)

1. Sube este repositorio a tu cuenta de **GitHub**.
2. Conecta el repositorio en [Vercel](https://vercel.com) o usa el botón **Deploy with Vercel**.
3. ¡Listo! Vercel detectará la configuración de Vite automáticamente y publicará la PWA en vivo.

---

## 💻 Ejecución Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilar para producción
npm run build
```

---

## 📐 Especificación EGM
Documento de diseño completo evaluado por el enjambre Goldfish en:
- [docs/designs/vfc_monitor.md](docs/designs/vfc_monitor.md)
- [docs/designs/SITEMAP.md](docs/designs/SITEMAP.md)

---

## 📄 Licencia
Distribuido bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
