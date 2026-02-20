"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const app = (0, express_1.default)();
const port = Number(process.env.PORT) || 3000;
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const dataFilePath = path_1.default.resolve(process.cwd(), 'data', 'enrollments.json');
const courses = [
    {
        id: 'front-ux',
        title: 'Front-end com foco em UX',
        description: 'Design responsivo, prototipagem e handoff entre times de produto.',
        level: 'Intermediario',
        duration: '6 semanas',
        format: 'Ao vivo',
    },
    {
        id: 'fullstack-js',
        title: 'Fullstack JavaScript',
        description: 'Do layout a API, criando experiencias completas com boas praticas.',
        level: 'Avancado',
        duration: '8 semanas',
        format: 'Hibrido',
    },
    {
        id: 'data-analytics',
        title: 'Analytics para Educacao',
        description: 'Transforme dados em decisoes com dashboards e indicadores.',
        level: 'Basico',
        duration: '4 semanas',
        format: 'Gravado',
    },
    {
        id: 'product-lead',
        title: 'Lideranca de Produto',
        description: 'Estruture backlog, visao e roadmap para produtos digitais.',
        level: 'Intermediario',
        duration: '5 semanas',
        format: 'Ao vivo',
    },
];
const ensureDataFile = async () => {
    try {
        await fs_1.promises.access(dataFilePath);
    }
    catch {
        await fs_1.promises.mkdir(path_1.default.dirname(dataFilePath), { recursive: true });
        await fs_1.promises.writeFile(dataFilePath, '[]', 'utf-8');
    }
};
const readEnrollments = async () => {
    await ensureDataFile();
    const fileContents = await fs_1.promises.readFile(dataFilePath, 'utf-8');
    try {
        return JSON.parse(fileContents);
    }
    catch {
        return [];
    }
};
const writeEnrollments = async (enrollments) => {
    await fs_1.promises.writeFile(dataFilePath, JSON.stringify(enrollments, null, 2), 'utf-8');
};
const validateEnrollment = (payload) => {
    const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : '';
    const email = typeof payload.email === 'string' ? payload.email.trim() : '';
    const courseId = typeof payload.courseId === 'string' ? payload.courseId.trim() : '';
    if (!fullName || fullName.length < 3) {
        return { ok: false, message: 'Nome completo obrigatorio.' };
    }
    if (!email || !email.includes('@')) {
        return { ok: false, message: 'Email invalido.' };
    }
    if (!courseId || !courses.some((course) => course.id === courseId)) {
        return { ok: false, message: 'Curso selecionado invalido.' };
    }
    return {
        ok: true,
        data: {
            fullName,
            email,
            courseId,
        },
    };
};
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({ origin: corsOrigin }));
app.use(express_1.default.json({ limit: '10kb' }));
app.get('/cursos', (_req, res) => {
    res.json(courses);
});
app.post('/matricula', async (req, res) => {
    const validation = validateEnrollment(req.body);
    if (!validation.ok) {
        return res.status(400).json({ message: validation.message });
    }
    const enrollments = await readEnrollments();
    const newEnrollment = {
        id: crypto_1.default.randomUUID(),
        ...validation.data,
        createdAt: new Date().toISOString(),
    };
    enrollments.push(newEnrollment);
    await writeEnrollments(enrollments);
    return res.status(201).json(newEnrollment);
});
app.use((err, _req, res, _next) => {
    res.status(500).json({ message: err.message || 'Erro interno inesperado.' });
});
ensureDataFile()
    .then(() => {
    app.listen(port, () => {
        console.log(`API listening on port ${port}`);
    });
})
    .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});
