// assets/js/admin-curriculo.js
// CRUD unificado do conteúdo exibido em cv.html (mesmas tabelas do Supabase)

import { protectAdminRoute, logout } from './auth.js';
import { supabase } from './supabase.js';

function pickLatestProfile(rows) {
  if (!rows?.length) return null;
  if (rows.length === 1) return rows[0];
  return rows.reduce((a, b) => {
    const ta = new Date(a.updated_at || a.created_at || 0).getTime();
    const tb = new Date(b.updated_at || b.created_at || 0).getTime();
    return tb >= ta ? b : a;
  });
}

/** Mesma regra do CV: mais recente (data_início) primeiro */
function ordenarPorDataInicioDesc(rows) {
  const t = (d) => {
    if (!d) return 0;
    const ms = new Date(d).getTime();
    return Number.isNaN(ms) ? 0 : ms;
  };
  return (rows || [])
    .slice()
    .sort((a, b) => {
      const db = t(b.data_inicio);
      const da = t(a.data_inicio);
      if (db !== da) return db - da;
      const oa = Number(a.ordem) || 0;
      const ob = Number(b.ordem) || 0;
      if (oa !== ob) return oa - ob;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
}

function parseTech(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim())
    return val.split(',').map((t) => t.trim()).filter(Boolean);
  return [];
}

export function curriculumCRUD() {
  return {
    sidebarOpen: false,
    loading: false,
    saving: false,
    error: null,
    success: false,
    successMessage: '',
    profileId: null,
    mainTab: 'dados',

    profileForm: {
      id: null,
      primeiro_nome: '',
      sobrenome: '',
      nome_completo: '',
      data_nascimento: '',
      local: '',
      pais: 'Brasil',
      ocupacao: '',
      descricao: '',
      keywords: '',
      github_url: '',
      linkedin_url: '',
      apresentacao_url: '',
      email: '',
      telefone: '',
      avatar_url: ''
    },

    professionalHistory: [],
    academicHistory: [],
    languages: [],
    certifications: [],
    hardSkills: [],
    softSkills: [],
    cvProjects: [],

    searchQuery: '',

    showHistoryModal: false,
    historyKind: 'professional',
    historyForm: {},
    newImageUrl: '',

    showLangModal: false,
    langForm: {},

    showCertModal: false,
    certForm: {},

    showHardModal: false,
    hardForm: {},

    showSoftModal: false,
    softForm: {},

    showProjModal: false,
    projForm: {},
    projTecnologiasText: '',

    async initAdmin() {
      const ok = await protectAdminRoute();
      if (!ok) return;
      await this.loadAll();
    },

    async loadAll() {
      this.loading = true;
      this.error = null;
      try {
        await this.loadProfile();
        await Promise.all([
          this.loadProfessional(),
          this.loadAcademic(),
          this.loadLanguages(),
          this.loadCertifications(),
          this.loadHard(),
          this.loadSoft(),
          this.loadCvProjects()
        ]);
      } catch (e) {
        this.error = e.message || 'Erro ao carregar dados.';
      } finally {
        this.loading = false;
      }
    },

    async loadProfile() {
      const { data: rows, error } = await supabase.from('profiles').select('*');
      if (error) throw error;
      const p = pickLatestProfile(rows || []);
      if (!p) {
        this.profileId = null;
        return;
      }
      this.profileId = p.id;
      this.profileForm = {
        id: p.id,
        primeiro_nome: p.primeiro_nome || '',
        sobrenome: p.sobrenome || '',
        nome_completo: p.nome_completo || p.nome || '',
        data_nascimento: p.data_nascimento || '',
        local: p.local || '',
        pais: p.pais || 'Brasil',
        ocupacao: p.ocupacao || p.titulo || '',
        descricao: p.descricao || p.bio || '',
        keywords: p.keywords || '',
        github_url: p.github_url || '',
        linkedin_url: p.linkedin_url || '',
        apresentacao_url: p.apresentacao_url || '',
        email: p.email || '',
        telefone: p.telefone || '',
        avatar_url: p.avatar_url || ''
      };
    },

    async saveProfile() {
      this.saving = true;
      this.error = null;
      this.success = false;
      try {
        const payload = { ...this.profileForm };
        delete payload.id;
        if (this.profileForm.id) {
          const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', this.profileForm.id);
          if (error) throw error;
        } else {
          const { data, error } = await supabase.from('profiles').insert([payload]).select().single();
          if (error) throw error;
          this.profileForm.id = data.id;
          this.profileId = data.id;
        }
        this.success = true;
        this.successMessage = 'Dados do currículo salvos.';
        setTimeout(() => { this.success = false; }, 3500);
      } catch (e) {
        this.error = e.message || 'Erro ao salvar perfil.';
      } finally {
        this.saving = false;
      }
    },

    async loadProfessional() {
      const { data, error } = await supabase
        .from('professional_history')
        .select('*')
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      this.professionalHistory = ordenarPorDataInicioDesc(data);
    },

    async loadAcademic() {
      const { data, error } = await supabase
        .from('academic_history')
        .select('*')
        .order('data_inicio', { ascending: false });
      if (error) throw error;
      this.academicHistory = ordenarPorDataInicioDesc(data);
    },

    async loadLanguages() {
      const { data, error } = await supabase.from('languages').select('*').order('ordem');
      if (error) throw error;
      this.languages = data || [];
    },

    async loadCertifications() {
      const { data, error } = await supabase.from('certifications').select('*').order('ordem');
      if (error) throw error;
      this.certifications = data || [];
    },

    async loadHard() {
      const { data, error } = await supabase.from('hard_skills').select('*').order('ordem');
      if (error) throw error;
      this.hardSkills = data || [];
    },

    async loadSoft() {
      const { data, error } = await supabase.from('soft_skills').select('*').order('ordem');
      if (error) throw error;
      this.softSkills = data || [];
    },

    async loadCvProjects() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('categoria', 'cv')
        .order('ordem', { ascending: true });
      if (error) throw error;
      this.cvProjects = data || [];
    },

    filterList(list, fields) {
      if (!this.searchQuery.trim()) return list;
      const q = this.searchQuery.toLowerCase();
      return list.filter((row) =>
        fields.some((f) => String(row[f] ?? '').toLowerCase().includes(q))
      );
    },

    get filteredProfessional() {
      return this.filterList(this.professionalHistory, ['instituicao', 'titulo', 'descricao']);
    },
    get filteredAcademic() {
      return this.filterList(this.academicHistory, ['instituicao', 'curso', 'descricao']);
    },
    get filteredLanguages() {
      return this.filterList(this.languages, ['idioma', 'nivel', 'instituicao']);
    },
    get filteredCerts() {
      return this.filterList(this.certifications, ['nome', 'instituicao']);
    },
    get filteredHard() {
      return this.filterList(this.hardSkills, ['nome', 'categoria']);
    },
    get filteredSoft() {
      return this.filterList(this.softSkills, ['nome']);
    },
    get filteredCvProjects() {
      return this.filterList(this.cvProjects, ['titulo', 'descricao_curta']);
    },

    openHistoryModal(kind, mode, id) {
      this.historyKind = kind;
      this.error = null;
      this.newImageUrl = '';
      if (mode === 'create') {
        this.historyForm = {
          id: null,
          instituicao: '',
          curso: '',
          titulo: '',
          regime: 'CLT',
          categoria_profissional: 'QA',
          local: '',
          tipo_local: 'Presencial',
          data_inicio: '',
          data_fim: '',
          atual: false,
          descricao: '',
          tipo_academico: 'Bacharel',
          tipo_local_acad: 'Presencial',
          logo_url: '',
          imagens_urls: [],
          ordem: 0
        };
      } else {
        const src =
          kind === 'professional'
            ? this.professionalHistory.find((x) => x.id === id)
            : this.academicHistory.find((x) => x.id === id);
        if (!src) return;
        this.historyForm = { ...src, curso: src.curso || '', titulo: src.titulo || '' };
        if (kind === 'professional') {
          this.historyForm.regime = src.regime || 'CLT';
          this.historyForm.categoria_profissional = src.categoria_profissional || 'QA';
          this.historyForm.local = src.local || '';
          this.historyForm.tipo_local = src.tipo_local || 'Presencial';
        } else {
          this.historyForm.tipo_academico = src.tipo_academico || src.tipo || 'Bacharel';
          this.historyForm.tipo_local_acad = src.tipo_local || 'Presencial';
        }
        if (!Array.isArray(this.historyForm.imagens_urls)) {
          this.historyForm.imagens_urls = [];
        }
      }
      this.showHistoryModal = true;
      const el = document.getElementById('curriculumHistoryModal');
      if (el) new bootstrap.Modal(el).show();
    },

    addHistoryImage() {
      if (!this.newImageUrl?.trim()) return;
      if (!this.historyForm.imagens_urls) this.historyForm.imagens_urls = [];
      this.historyForm.imagens_urls.push(this.newImageUrl.trim());
      this.newImageUrl = '';
    },
    removeHistoryImage(i) {
      this.historyForm.imagens_urls.splice(i, 1);
    },

    async saveHistory() {
      this.saving = true;
      this.error = null;
      try {
        const kind = this.historyKind;
        const table = kind === 'professional' ? 'professional_history' : 'academic_history';
        const raw = { ...this.historyForm };
        delete raw.tipo_local_acad;

        if (kind === 'professional') {
          const data = {
            instituicao: raw.instituicao,
            titulo: raw.titulo,
            regime: raw.regime,
            categoria_profissional: raw.categoria_profissional,
            local: raw.local,
            tipo_local: raw.tipo_local,
            data_inicio: raw.data_inicio,
            data_fim: raw.data_fim || null,
            atual: !!raw.atual,
            descricao: raw.descricao,
            logo_url: raw.logo_url || null,
            imagens_urls: raw.imagens_urls || [],
            ordem: Number(raw.ordem) || 0
          };
          if (raw.id) {
            const { error } = await supabase.from(table).update(data).eq('id', raw.id);
            if (error) throw error;
          } else {
            if (this.profileId) data.profile_id = this.profileId;
            const { error } = await supabase.from(table).insert([data]);
            if (error) throw error;
          }
        } else {
          const data = {
            instituicao: raw.instituicao,
            curso: raw.curso,
            tipo_academico: raw.tipo_academico,
            tipo_local: raw.tipo_local_acad || raw.tipo_local,
            data_inicio: raw.data_inicio,
            data_fim: raw.data_fim || null,
            atual: !!raw.atual,
            descricao: raw.descricao,
            logo_url: raw.logo_url || null,
            imagens_urls: raw.imagens_urls || [],
            ordem: Number(raw.ordem) || 0
          };
          if (raw.id) {
            const { error } = await supabase.from(table).update(data).eq('id', raw.id);
            if (error) throw error;
          } else {
            if (this.profileId) data.profile_id = this.profileId;
            const { error } = await supabase.from(table).insert([data]);
            if (error) throw error;
          }
        }

        await this.loadProfessional();
        await this.loadAcademic();
        this.closeHistoryModal();
        this.flash('Registro salvo.');
      } catch (e) {
        this.error = e.message || 'Erro ao salvar.';
      } finally {
        this.saving = false;
      }
    },

    async deleteHistory(kind, id) {
      if (!confirm('Excluir este registro?')) return;
      const table = kind === 'professional' ? 'professional_history' : 'academic_history';
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) {
        alert(error.message);
        return;
      }
      await this.loadProfessional();
      await this.loadAcademic();
      this.flash('Removido.');
    },

    closeHistoryModal() {
      this.showHistoryModal = false;
      const m = bootstrap.Modal.getInstance(document.getElementById('curriculumHistoryModal'));
      if (m) m.hide();
    },

    openLangModal(mode, id) {
      this.error = null;
      if (mode === 'create') {
        this.langForm = { id: null, idioma: '', nivel: 'Intermediário', cursando: false, instituicao: '', ordem: 0 };
      } else {
        const x = this.languages.find((r) => r.id === id);
        if (!x) return;
        this.langForm = { ...x };
      }
      this.showLangModal = true;
      const el = document.getElementById('curriculumLangModal');
      if (el) new bootstrap.Modal(el).show();
    },

    async saveLang() {
      this.saving = true;
      this.error = null;
      try {
        const row = { ...this.langForm };
        delete row.id;
        if (this.langForm.id) {
          const { error } = await supabase.from('languages').update(row).eq('id', this.langForm.id);
          if (error) throw error;
        } else {
          if (this.profileId) row.profile_id = this.profileId;
          const { error } = await supabase.from('languages').insert([row]);
          if (error) throw error;
        }
        await this.loadLanguages();
        this.closeLangModal();
        this.flash('Idioma salvo.');
      } catch (e) {
        this.error = e.message || 'Erro ao salvar idioma.';
      } finally {
        this.saving = false;
      }
    },

    async deleteLang(id) {
      if (!confirm('Excluir idioma?')) return;
      await supabase.from('languages').delete().eq('id', id);
      await this.loadLanguages();
    },

    closeLangModal() {
      const m = bootstrap.Modal.getInstance(document.getElementById('curriculumLangModal'));
      if (m) m.hide();
      this.showLangModal = false;
    },

    openCertModal(mode, id) {
      this.error = null;
      if (mode === 'create') {
        this.certForm = {
          id: null,
          nome: '',
          instituicao: '',
          data_certificacao: '',
          validade: '',
          certificado_url: '',
          ordem: 0
        };
      } else {
        const x = this.certifications.find((r) => r.id === id);
        if (!x) return;
        this.certForm = { ...x };
      }
      this.showCertModal = true;
      const el = document.getElementById('curriculumCertModal');
      if (el) new bootstrap.Modal(el).show();
    },

    async saveCert() {
      this.saving = true;
      this.error = null;
      try {
        const row = { ...this.certForm };
        delete row.id;
        if (this.certForm.id) {
          const { error } = await supabase.from('certifications').update(row).eq('id', this.certForm.id);
          if (error) throw error;
        } else {
          if (this.profileId) row.profile_id = this.profileId;
          const { error } = await supabase.from('certifications').insert([row]);
          if (error) throw error;
        }
        await this.loadCertifications();
        this.closeCertModal();
        this.flash('Certificação salva.');
      } catch (e) {
        this.error = e.message || 'Erro ao salvar certificação.';
      } finally {
        this.saving = false;
      }
    },

    async deleteCert(id) {
      if (!confirm('Excluir certificação?')) return;
      await supabase.from('certifications').delete().eq('id', id);
      await this.loadCertifications();
    },

    closeCertModal() {
      const m = bootstrap.Modal.getInstance(document.getElementById('curriculumCertModal'));
      if (m) m.hide();
      this.showCertModal = false;
    },

    openHardModal(mode, id) {
      this.error = null;
      if (mode === 'create') {
        this.hardForm = { id: null, nome: '', categoria: '', nivel: 0, ordem: 0 };
      } else {
        const x = this.hardSkills.find((r) => r.id === id);
        if (!x) return;
        this.hardForm = { ...x };
      }
      this.showHardModal = true;
      const el = document.getElementById('curriculumHardModal');
      if (el) new bootstrap.Modal(el).show();
    },

    async saveHard() {
      this.saving = true;
      this.error = null;
      try {
        const row = { ...this.hardForm };
        delete row.id;
        row.nivel = Number(row.nivel) || 0;
        row.ordem = Number(row.ordem) || 0;
        if (this.hardForm.id) {
          const { error } = await supabase.from('hard_skills').update(row).eq('id', this.hardForm.id);
          if (error) throw error;
        } else {
          if (this.profileId) row.profile_id = this.profileId;
          const { error } = await supabase.from('hard_skills').insert([row]);
          if (error) throw error;
        }
        await this.loadHard();
        this.closeHardModal();
        this.flash('Hard skill salva.');
      } catch (e) {
        this.error = e.message || 'Erro ao salvar.';
      } finally {
        this.saving = false;
      }
    },

    async deleteHard(id) {
      if (!confirm('Excluir?')) return;
      await supabase.from('hard_skills').delete().eq('id', id);
      await this.loadHard();
    },

    closeHardModal() {
      const m = bootstrap.Modal.getInstance(document.getElementById('curriculumHardModal'));
      if (m) m.hide();
      this.showHardModal = false;
    },

    openSoftModal(mode, id) {
      this.error = null;
      if (mode === 'create') {
        this.softForm = { id: null, nome: '', ordem: 0 };
      } else {
        const x = this.softSkills.find((r) => r.id === id);
        if (!x) return;
        this.softForm = { ...x };
      }
      this.showSoftModal = true;
      const el = document.getElementById('curriculumSoftModal');
      if (el) new bootstrap.Modal(el).show();
    },

    async saveSoft() {
      this.saving = true;
      this.error = null;
      try {
        const row = { ...this.softForm };
        delete row.id;
        row.ordem = Number(row.ordem) || 0;
        if (this.softForm.id) {
          const { error } = await supabase.from('soft_skills').update(row).eq('id', this.softForm.id);
          if (error) throw error;
        } else {
          if (this.profileId) row.profile_id = this.profileId;
          const { error } = await supabase.from('soft_skills').insert([row]);
          if (error) throw error;
        }
        await this.loadSoft();
        this.closeSoftModal();
        this.flash('Soft skill salva.');
      } catch (e) {
        this.error = e.message || 'Erro ao salvar.';
      } finally {
        this.saving = false;
      }
    },

    async deleteSoft(id) {
      if (!confirm('Excluir?')) return;
      await supabase.from('soft_skills').delete().eq('id', id);
      await this.loadSoft();
    },

    closeSoftModal() {
      const m = bootstrap.Modal.getInstance(document.getElementById('curriculumSoftModal'));
      if (m) m.hide();
      this.showSoftModal = false;
    },

    openProjModal(mode, id) {
      this.error = null;
      if (mode === 'create') {
        this.projForm = {
          id: null,
          titulo: '',
          descricao_curta: '',
          descricao_completa: '',
          data_projeto: '',
          ordem: 0,
          ativo: true,
          imagem_url: '',
          link_projeto: '',
          link_github: ''
        };
        this.projTecnologiasText = '';
      } else {
        const x = this.cvProjects.find((r) => r.id === id);
        if (!x) return;
        this.projForm = { ...x };
        this.projTecnologiasText = Array.isArray(x.tecnologias) ? x.tecnologias.join(', ') : x.tecnologias || '';
      }
      this.showProjModal = true;
      const el = document.getElementById('curriculumProjModal');
      if (el) new bootstrap.Modal(el).show();
    },

    async saveProj() {
      this.saving = true;
      this.error = null;
      try {
        const row = {
          titulo: this.projForm.titulo,
          descricao_curta: this.projForm.descricao_curta,
          descricao_completa: this.projForm.descricao_completa || '',
          data_projeto: this.projForm.data_projeto || null,
          ordem: Number(this.projForm.ordem) || 0,
          ativo: !!this.projForm.ativo,
          imagem_url: this.projForm.imagem_url || null,
          link_projeto: this.projForm.link_projeto || null,
          link_github: this.projForm.link_github || null,
          categoria: 'cv',
          tecnologias: parseTech(this.projTecnologiasText)
        };
        if (this.projForm.id) {
          const { error } = await supabase.from('projects').update(row).eq('id', this.projForm.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from('projects').insert([row]);
          if (error) throw error;
        }
        await this.loadCvProjects();
        this.closeProjModal();
        this.flash('Projeto (CV) salvo.');
      } catch (e) {
        this.error = e.message || 'Erro ao salvar projeto.';
      } finally {
        this.saving = false;
      }
    },

    async deleteProj(id) {
      if (!confirm('Excluir este bloco de projeto do currículo?')) return;
      await supabase.from('projects').delete().eq('id', id);
      await this.loadCvProjects();
    },

    closeProjModal() {
      const m = bootstrap.Modal.getInstance(document.getElementById('curriculumProjModal'));
      if (m) m.hide();
      this.showProjModal = false;
    },

    flash(msg) {
      this.successMessage = msg;
      this.success = true;
      setTimeout(() => { this.success = false; }, 3000);
    },

    formatDate(d) {
      if (!d) return '—';
      return new Date(d).toLocaleDateString('pt-BR');
    },

    async handleLogout() {
      if (confirm('Sair?')) await logout();
    }
  };
}

window.curriculumCRUD = curriculumCRUD;
