<script setup>
import { computed, onMounted, ref } from 'vue'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const courses = ref([])
const coursesLoading = ref(true)
const coursesError = ref('')

const fullName = ref('')
const email = ref('')
const selectedCourseId = ref('')

const submitting = ref(false)
const submitError = ref('')
const submitSuccess = ref(false)

const selectedCourse = computed(() =>
  courses.value.find((course) => course.id === selectedCourseId.value)
)

const isFormValid = computed(() => {
  if (!fullName.value.trim()) return false
  if (!email.value.includes('@')) return false
  if (!selectedCourseId.value) return false
  return true
})

const loadCourses = async () => {
  coursesLoading.value = true
  coursesError.value = ''

  try {
    const response = await fetch(`${apiBaseUrl}/cursos`)
    if (!response.ok) {
      throw new Error('Nao foi possivel carregar os cursos.')
    }
    const data = await response.json()
    courses.value = data
  } catch (error) {
    coursesError.value = error instanceof Error ? error.message : 'Erro inesperado.'
  } finally {
    coursesLoading.value = false
  }
}

const submitEnrollment = async () => {
  if (!isFormValid.value || submitting.value) return

  submitting.value = true
  submitError.value = ''
  submitSuccess.value = false

  try {
    const response = await fetch(`${apiBaseUrl}/matricula`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        courseId: selectedCourseId.value,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      throw new Error(payload?.message || 'Erro ao enviar a matricula.')
    }

    submitSuccess.value = true
    fullName.value = ''
    email.value = ''
    selectedCourseId.value = ''
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : 'Erro inesperado.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadCourses)
</script>

<template>
  <div class="page">
    <header class="hero">
      <p class="hero__tag">Matriculas on-line</p>
      <h1 class="hero__title">Seu proximo curso esta aqui</h1>
      <p class="hero__subtitle">
        Selecione um curso, envie seus dados e garanta sua vaga com um fluxo rapido e seguro.
      </p>
      <div class="hero__stats">
        <div>
          <span class="hero__stat">18</span>
          <span class="hero__label">Cursos ativos</span>
        </div>
        <div>
          <span class="hero__stat">4.8</span>
          <span class="hero__label">Media dos alunos</span>
        </div>
        <div>
          <span class="hero__stat">100%</span>
          <span class="hero__label">Online e flexivel</span>
        </div>
      </div>
    </header>

    <main class="content">
      <section class="panel">
        <div class="panel__header">
          <h2>Escolha seu curso</h2>
          <p>Planeje seu aprendizado com opcoes atuais e orientadas a pratica.</p>
        </div>

        <div v-if="coursesLoading" class="state">Carregando cursos...</div>
        <div v-else-if="coursesError" class="state state--error" role="alert">
          {{ coursesError }}
        </div>
        <div v-else class="course-grid">
          <button
            v-for="course in courses"
            :key="course.id"
            type="button"
            class="course-card"
            :class="{ 'course-card--selected': selectedCourseId === course.id }"
            @click="selectedCourseId = course.id"
          >
            <div class="course-card__header">
              <h3>{{ course.title }}</h3>
              <span class="pill">{{ course.level }}</span>
            </div>
            <p>{{ course.description }}</p>
            <div class="course-card__meta">
              <span>{{ course.duration }}</span>
              <span>{{ course.format }}</span>
            </div>
          </button>
        </div>
      </section>

      <section class="panel panel--form">
        <div class="panel__header">
          <h2>Finalize sua matricula</h2>
          <p>Preencha seus dados e confirme o curso escolhido.</p>
        </div>

        <form class="form" @submit.prevent="submitEnrollment">
          <label class="field">
            <span>Nome completo</span>
            <input
              v-model="fullName"
              type="text"
              name="fullName"
              autocomplete="name"
              placeholder="Ex: Maria Silva"
              required
            />
          </label>

          <label class="field">
            <span>Email</span>
            <input
              v-model="email"
              type="email"
              name="email"
              autocomplete="email"
              placeholder="voce@email.com"
              required
            />
          </label>

          <label class="field">
            <span>Curso selecionado</span>
            <input
              :value="selectedCourse ? selectedCourse.title : ''"
              type="text"
              name="course"
              placeholder="Selecione um curso ao lado"
              readonly
              aria-live="polite"
            />
          </label>

          <button class="primary" type="submit" :disabled="!isFormValid || submitting">
            {{ submitting ? 'Enviando...' : 'Confirmar matricula' }}
          </button>

          <p v-if="submitSuccess" class="state state--success" role="status">
            Matricula enviada com sucesso. Em breve voce recebera um email com os proximos passos.
          </p>
          <p v-else-if="submitError" class="state state--error" role="alert">
            {{ submitError }}
          </p>
        </form>
      </section>
    </main>
  </div>
</template>
