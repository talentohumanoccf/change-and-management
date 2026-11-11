// Contenido de la sesión compartido por index.html y el tablero de resultados.
// Es un script clásico (no un módulo) para que cargue también al abrir el archivo
// directamente desde el disco.
window.SESSION_CONTENT = (() => {
    const DEFAULT_APP_ID = 'sesion-comfamiliar-team-mood-30';

    const MOODS = {
        feliz: { id: 'feliz', label: 'Feliz', icon: 'fa-smile', color: 'text-amber-400', bgColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', description: 'Optimista' },
        motivado: { id: 'motivado', label: 'Motivado', icon: 'fa-star', color: 'text-emerald-400', bgColor: 'rgba(52, 211, 153, 0.2)', borderColor: '#34d399', description: 'Con energía' },
        neutro: { id: 'neutro', label: 'Neutro', icon: 'fa-meh', color: 'text-slate-400', bgColor: 'rgba(148, 163, 184, 0.2)', borderColor: '#94a3b8', description: 'En pausa' },
        triste: { id: 'triste', label: 'Triste', icon: 'fa-frown', color: 'text-sky-400', bgColor: 'rgba(56, 189, 248, 0.2)', borderColor: '#38bdf8', description: 'Baja energía' },
        retado: { id: 'retado', label: 'Retado', icon: 'fa-fire', color: 'text-rose-500', bgColor: 'rgba(244, 63, 94, 0.2)', borderColor: '#f43f5e', description: 'En desafío' },
        curioso: { id: 'curioso', label: 'Curioso', icon: 'fa-lightbulb', color: 'text-purple-400', bgColor: 'rgba(192, 132, 252, 0.2)', borderColor: '#c084fc', description: 'Descubriendo' }
    };

    const COLABORADOR_STEPS = [
        {
            index: 0,
            id: 'waiting',
            shortLabel: '00 · En Espera',
            blockBadge: 'Encuentro de Líderes • El Nuevo Colaborador',
            title: 'Atento a la presentación principal',
            subtitle: 'Aquí aparecerá automáticamente cada pregunta en la medida en que el presentador la active durante la sesión.',
            type: 'waiting_presenter'
        },
        {
            index: 1,
            id: 'm1_q1',
            shortLabel: 'P1 · Procesos con IA',
            blockBadge: 'Momento 1 • Impacto de la IA (Pregunta 1 de 3)',
            title: '¿En qué procesos de tu área ya se usa inteligencia artificial?',
            subtitle: 'Selecciona la opción principal de tu área.',
            type: 'poll',
            pollKey: 'm1_q1',
            options: [
                { key: 'A', label: 'Selección' },
                { key: 'B', label: 'Formación' },
                { key: 'C', label: 'Bienestar y clima' },
                { key: 'D', label: 'Nómina y administración de personal' },
                { key: 'E', label: 'Evaluación de desempeño' },
                { key: 'F', label: 'Comunicación interna' },
                { key: 'G', label: 'Atención de preguntas de colaboradores' },
                { key: 'H', label: 'Todavía en ninguno' }
            ]
        },
        {
            index: 2,
            id: 'm1_q2',
            shortLabel: 'P2 · IA no autorizada',
            blockBadge: 'Momento 1 • La IA que nadie contrató (Pregunta 2 de 3)',
            title: '¿Alguna vez has puesto en una IA gratuita información de personas de tu organización, como hojas de vida, evaluaciones o datos de nómina?',
            subtitle: 'Es anónima de verdad: nadie sabrá qué respondiste.',
            type: 'poll',
            pollKey: 'm1_q2',
            isAnonymous: true,
            options: [
                { key: 'A', label: 'Sí' },
                { key: 'B', label: 'No' },
                { key: 'C', label: 'No estoy seguro' }
            ]
        },
        {
            index: 3,
            id: 'm1_q3',
            shortLabel: 'P3 · Nube: Mayor impacto',
            blockBadge: 'Momento 1 • Nube de Palabras (Pregunta 3 de 3)',
            title: '¿Cuál ha sido el mayor impacto de la IA en tu área?',
            subtitle: 'Escribe una sola palabra que describa el impacto principal.',
            type: 'wordcloud',
            pollKey: 'm1_q3',
            placeholder: 'Ej: Automatización, Eficiencia, Miedo, Rapidez...'
        },
        {
            index: 4,
            id: 'humano_ia_1',
            shortLabel: 'Humano/IA · Ronda 1',
            blockBadge: 'Momento 2 • Humano o IA (Ronda 1 de 2)',
            title: 'Ronda 1: Mensaje a un candidato no seleccionado',
            subtitle: 'Uno lo escribió una persona y el otro una IA. ¿Cuál escribió la IA?',
            type: 'ab_challenge',
            pollKey: 'humano_ia_1',
            revealKey: 'humano_ia_1',
            cardA: 'Estimado Andrés: Agradecemos sinceramente tu interés y el tiempo dedicado a nuestro proceso de selección. Después de una cuidadosa evaluación, hemos decidido continuar con otros candidatos cuyo perfil se ajusta más a las necesidades actuales del cargo. Te animamos a estar atento a futuras oportunidades. Te deseamos muchos éxitos.',
            cardB: 'Hola, Andrés. Gracias por presentarte. No quedaste esta vez; la decisión fue entre tú y otra persona con más experiencia en nómina, que era lo que más pesaba dentro de todo el proceso de selección. Tu entrevista fue de las mejores. Si a futuro abrimos la vacante de analista, cuenta con nosotros para saber si te interesa participar. Te deseamos muchos éxitos.',
            aiIs: 'A',
            verdictA: { badge: 'IA', note: 'Mejor redacción. Correcta, cuidadosa… y genérica.' },
            verdictB: { badge: 'HUMANO', note: 'Da una razón y deja una puerta abierta.' },
            takeaway: 'La IA redacta mejor. La persona explica por qué.'
        },
        {
            index: 5,
            id: 'humano_ia_2',
            shortLabel: 'Humano/IA · Ronda 2',
            blockBadge: 'Momento 2 • Humano o IA (Ronda 2 de 2)',
            title: 'Ronda 2: Convocatoria al torneo de bolos',
            subtitle: '¿Cuál de las dos convocatorias escribió la IA?',
            type: 'ab_challenge',
            pollKey: 'humano_ia_2',
            revealKey: 'humano_ia_2',
            cardA: 'Ojo pues: el viernes hay torneo de bolos y quedan seis cupos. El año pasado ganó Cartera y no han dejado de recordárnoslo. Inscríbete antes del jueves si quieres quitarles el título.',
            cardB: 'Te invitamos a participar en el torneo de bolos que se realizará este viernes. Inscríbete antes del jueves en el enlace adjunto. ¡Cupos limitados!',
            aiIs: 'A',
            verdictA: { badge: 'IA', note: 'Con el contexto correcto: quién ganó el año pasado, cuántos cupos quedan, cómo habla la casa.' },
            verdictB: { badge: 'HUMANO', note: 'Escrito con afán, a las 5:40 p. m., entre dos reuniones.' },
            takeaway: 'La IA rinde según la inducción que le den. Contexto, criterios y límites: exactamente lo que Talento Humano hace en una inducción.'
        },
        {
            index: 6,
            id: 'm4_final',
            shortLabel: 'Cierre · Votación Final',
            blockBadge: 'Momento 4 • La Última Votación',
            title: '¿Cuánto de esta presentación creen que hizo la IA?',
            subtitle: 'Vota según tu percepción de lo que viste en toda la sesión.',
            type: 'cierre_autor',
            pollKey: 'm4_final',
            options: [
                { key: 'A', label: 'Nada: la hizo toda una persona' },
                { key: 'B', label: 'Poco: más persona que IA' },
                { key: 'C', label: 'Mitad y mitad' },
                { key: 'D', label: 'Mucho: más IA que persona' },
                { key: 'E', label: 'Todo: la hizo toda la IA' }
            ],
            verdictProduction: 'Más IA que persona. Borradores, láminas e ilustraciones animadas.',
            verdictDecisions: '100 % personas. Qué decir, qué dejar por fuera, qué era verdad y qué no.',
            takeaway: 'La IA produce. Las personas deciden y responden.'
        },
        // Voluntarios para conversar con Aba en la tarima. La clave no empieza por `aba_` a
        // propósito: esas son respuestas a preguntas abiertas y el escenario las pone en el muro.
        {
            index: 7,
            id: 'voluntario_aba',
            shortLabel: 'Aba · Voluntarios',
            blockBadge: 'Cierre • Conversa con Aba',
            title: '¿Quién quiere pasar a conversar con Aba?',
            subtitle: 'Postúlate desde tu celular. Quien conduce elige quién pasa a la tarima.',
            type: 'aba_volunteer',
            pollKey: 'voluntario_aba'
        },
        // Pregunta abierta que Aba lee en la pantalla del escenario. `title` es la pregunta con la
        // que arranca; el facilitador abre las siguientes con «Abrir nueva pregunta».
        {
            index: 8,
            id: 'aba_1',
            shortLabel: 'Participa con Aba',
            blockBadge: 'Cierre • Participa con Aba',
            title: '¿Qué le pedirías a una colaboradora de IA como Aba en tu equipo?',
            subtitle: 'Escríbelo o díctalo con el micrófono del teclado. Aba lo va a leer en la pantalla.',
            type: 'aba_open',
            pollKey: 'aba_1',
            placeholder: 'Escribe aquí tu respuesta…'
        }
    ];

    // Peso divergente de 0 a 100 a partir de los puntajes de Prisma. El suavizado evita
    // perfiles extremos cuando hay pocas respuestas.
    function divergentWeight(s) {
        const div = Math.max(0, Number(s?.divergent) || 0);
        const conv = Math.max(0, Number(s?.convergent) || 0);
        if (div === 0 && conv === 0) return 50;
        const smoothedDiv = div + 20;
        const smoothedConv = conv + 20;
        return (smoothedDiv / (smoothedDiv + smoothedConv)) * 100;
    }

    // Mismos cortes que usa index.html para nombrar el perfil.
    function thinkingProfile(scores) {
        const weight = divergentWeight(scores);
        if (weight > 58) return 'disruptive';
        if (weight >= 42) return 'strategic';
        return 'solver';
    }

    return { DEFAULT_APP_ID, MOODS, COLABORADOR_STEPS, divergentWeight, thinkingProfile };
})();
