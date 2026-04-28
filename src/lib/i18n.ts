export const t = {
  brand: "Safebreeder",
  tagline: "Gestión sanitaria y productiva del ganado",

  nav: {
    establishments: "Establecimientos",
    data: "Carga de datos",
    dashboard: "Estadísticas",
    plans: "Planes",
    admin: "Admin",
  },

  common: {
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    confirm: "Confirmar",
    add: "Agregar",
    back: "Volver",
    close: "Cerrar",
    download: "Descargar",
    empty: "Sin datos",
    observations: "Observaciones",
    required: "Requerido",
    optional: "Opcional",
    yes: "Sí",
    no: "No",
    loading: "Cargando…",
    export: "Exportar",
    import: "Importar",
    all: "Todos",
    confirmDelete: "¿Eliminar? Esta acción no se puede deshacer.",
  },

  establishments: {
    title: "Establecimientos",
    subtitle: "Administrá tus campos y tus rodeos",
    create: "Nuevo establecimiento",
    name: "Nombre",
    owner: "Propietario",
    district: "Partido",
    province: "Provincia",
    lotsCount: (n: number) => (n === 1 ? "1 lote" : `${n} lotes`),
    empty: "Todavía no creaste ningún establecimiento.",
    createFirst: "Crear el primero",
  },

  lot: {
    title: "Lotes",
    create: "Nuevo lote",
    name: "Nombre del lote",
    category: "Categoría",
    headCount: "Cantidad de animales",
    empty: "Este establecimiento todavía no tiene lotes.",
    hpgMonths: (n: number) => `${n} mes${n === 1 ? "" : "es"} HPG`,
    weightMonths: (n: number) => `${n} pesada${n === 1 ? "" : "s"}`,
    treatments: (n: number) => `${n} tratamiento${n === 1 ? "" : "s"}`,
    openData: "Cargar datos",
    openReport: "Ver informe",
    categories: {
      recriaMachos: "Recría machos",
      recriaHembras: "Recría hembras",
      ternerosDestetados: "Terneros destetados",
      novillos: "Novillos",
      vaquillonas: "Vaquillonas",
      otro: "Otro",
    } as const,
  },

  period: {
    month: "Mes",
    year: "Año",
    selectPeriod: "Período",
  },

  months: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],

  hpg: {
    title: "HPG",
    subtitle: "Huevos por gramo (recuento parasitario)",
    tagId: "Caravana",
    weight: "Peso (kg)",
    value: "HPG",
    level: "Nivel",
    addRow: "Agregar muestra",
    legend: "0-150 bajo · 150-500 moderado · >500 alto",
    low: "Bajo",
    moderate: "Moderado",
    high: "Alto",
    none: "Sin dato",
    sampleCount: "Muestras",
    average: "Promedio",
    max: "Máximo",
    positives: "Positivos",
    sampleDate: "Fecha de muestreo",
    reminder: {
      title: "Recordatorio del próximo muestreo",
      helper: "Te avisamos a los 27 días — 3 días antes de cumplir el ciclo de 30.",
      trigger: "Recordatorio",
      addGoogle: "Google Calendar",
      downloadIcs: "Descargar .ics (Apple / Outlook)",
      eventTitle: (lotName: string) => `Muestreo HPG — ${lotName}`,
      eventDescription: (params: {
        lotName: string;
        estName: string;
        cycleDate: string;
        lotUrl: string;
      }) =>
        `Recordatorio de muestreo HPG para el lote ${params.lotName} (${params.estName}).\n` +
        `Se cumplen 30 días el ${params.cycleDate}.\n\n` +
        `Cargá las muestras en Safebreeder:\n${params.lotUrl}`,
    },
  },

  treatment: {
    title: "Tratamiento",
    subtitle: "Plan sanitario del mes",
    date: "Fecha del tratamiento",
    drug: "Droga",
    brand: "Nombre comercial",
    route: "Vía de administración",
    dose: "Dosis",
    weight: "Peso promedio del lote",
    criterion: "Criterio de dosificación",
    bcs: "Estado corporal",
    ectoparasites: "Ectoparásitos",
    ectoType: "Tipo de ectoparásito",
    ectoDrug: "Droga",
    ectoRoute: "Vía de administración",
    ectoTitle: "Ectoparásitos",
    ectoSubtitle: "Detección y tratamiento",
    diarrhea: "Diarrea / signos clínicos",
    ectoLevels: {
      none: "No",
      mild: "Leve",
      moderate: "Moderada",
      severe: "Severa",
    },
    diarrheaLevels: {
      none: "No",
      mild: "Leve",
      severe: "Severa",
    },
  },

  vaccines: {
    title: "Vacunas",
    subtitle: "Plan de vacunación del mes",
    date: "Fecha",
    type: "Vacuna",
    doseNumber: "N°",
    brand: "Nombre comercial",
    dose: "Dosis",
    addAnother: "Agregar vacuna",
    types: {
      complejoRespiratorio: "Complejo respiratorio",
      complejoRespiratorioQuerato: "Complejo respiratorio + Querato",
      queratoconjuntivitis: "Queratoconjuntivitis",
      clostridial: "Clostridial",
      leptospirosis: "Leptospirosis",
    },
    doseNumbers: {
      "1": "1ra dosis",
      "2": "2da dosis",
      "3": "3ra dosis",
      refuerzo: "Refuerzo",
    },
  },

  weights: {
    title: "Pesadas",
    subtitle: "Seguimiento de peso y ganancia diaria",
    tagId: "Caravana",
    current: "Peso actual (kg)",
    previous: "Mes anterior",
    gain: "Ganancia total",
    adg: "GDP (kg/día)",
    addRow: "Agregar fila",
    animals: "Animales",
    avgWeight: "Peso promedio",
    avgAdg: "GDP promedio",
  },

  dashboard: {
    title: "Resumen y gráficos",
    subtitle: "Panorama general de tus rodeos",
    filter: "Filtrar por establecimiento",
    allEstablishments: "Todos los establecimientos",
    kpiLots: "Lotes",
    kpiSamples: "Muestras",
    kpiLow: "% bajo",
    kpiModerate: "% moderado",
    kpiHigh: "% alto",
    chartByLot: "HPG promedio por lote",
    chartDistribution: "Distribución parasitaria",
    chartEvolution: "Evolución mensual",
    chartAdg: "GDP por lote (kg/día)",
    chartWeight: "Peso promedio por lote (kg)",
    chartTreatments: "Tratamientos por droga",
    tableTitle: "Resumen HPG mensual por lote",
    tableGdpTitle: "Resumen GDP mensual por lote (kg/día)",
    noData: "Aún no hay datos para mostrar. Cargá HPG en algún lote para ver el panel.",
  },

  report: {
    title: "Informe sanitario",
    download: "Descargar PDF",
    generatedOn: "Generado el",
    establishment: "Establecimiento",
    lot: "Lote",
    period: "Período",
    sectionTreatment: "Tratamiento",
    sectionVaccines: "Vacunas",
    sectionHpg: "HPG",
    sectionWeights: "Pesadas",
    emptyPeriod: "No hay datos cargados para este período.",
  },

  export: {
    exportJson: "Exportar datos",
    importJson: "Importar datos",
    exportSuccess: "Descarga generada",
    importSuccess: "Datos importados",
    importError: "Archivo inválido",
  },

  migration: {
    imported: "Importamos tus datos anteriores de ParasiControl.",
  },
} as const;

export function lotCategoryLabel(
  c: keyof typeof t.lot.categories | string,
): string {
  return (
    (t.lot.categories as Record<string, string>)[c] ?? t.lot.categories.otro
  );
}
