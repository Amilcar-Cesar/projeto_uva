import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { promises as fs } from 'fs'
import path from 'path'
import crypto from 'crypto'

const app = express()

const port = Number(process.env.PORT) || 3000
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173'

const dataFilePath = path.resolve(process.cwd(), 'data', 'enrollments.json')

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
]

const ensureDataFile = async () => {
  try {
    await fs.access(dataFilePath)
  } catch {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true })
    await fs.writeFile(dataFilePath, '[]', 'utf-8')
  }
}

const readEnrollments = async () => {
  await ensureDataFile()
  const fileContents = await fs.readFile(dataFilePath, 'utf-8')
  try {
    return JSON.parse(fileContents)
  } catch {
    return []
  }
}

const writeEnrollments = async (enrollments: unknown[]) => {
  await fs.writeFile(dataFilePath, JSON.stringify(enrollments, null, 2), 'utf-8')
}

const validateEnrollment = (payload: Record<string, unknown>) => {
  const fullName = typeof payload.fullName === 'string' ? payload.fullName.trim() : ''
  const email = typeof payload.email === 'string' ? payload.email.trim() : ''
  const courseId = typeof payload.courseId === 'string' ? payload.courseId.trim() : ''

  if (!fullName || fullName.length < 3) {
    return { ok: false, message: 'Nome completo obrigatorio.' }
  }

  if (!email || !email.includes('@')) {
    return { ok: false, message: 'Email invalido.' }
  }

  if (!courseId || !courses.some((course) => course.id === courseId)) {
    return { ok: false, message: 'Curso selecionado invalido.' }
  }

  return {
    ok: true,
    data: {
      fullName,
      email,
      courseId,
    },
  }
}

app.use(helmet())
app.use(cors({ origin: corsOrigin }))
app.use(express.json({ limit: '10kb' }))

app.get('/cursos', (_req, res) => {
  res.json(courses)
})

app.post('/matricula', async (req, res) => {
  const validation = validateEnrollment(req.body)
  if (!validation.ok) {
    return res.status(400).json({ message: validation.message })
  }

  const enrollments = await readEnrollments()
  const newEnrollment = {
    id: crypto.randomUUID(),
    ...validation.data,
    createdAt: new Date().toISOString(),
  }

  enrollments.push(newEnrollment)
  await writeEnrollments(enrollments)

  return res.status(201).json(newEnrollment)
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ message: err.message || 'Erro interno inesperado.' })
})

ensureDataFile()
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on port ${port}`)
    })
  })
  .catch((error) => {
    console.error('Failed to start server:', error)
    process.exit(1)
  })
