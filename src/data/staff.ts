import type { ExecutiveDefinition } from '@/types';

export const EXECUTIVE_POOL: ExecutiveDefinition[] = [
  // ========== ESTAGIÁRIOS (Intern - 70%) ==========
  {
    id: 'intern-maria',
    name: 'Maria do Socorro',
    rarity: 'intern',
    portrait: '👩‍💼',
    multiplier: { type: 'profit', value: 0.02 },
    flavor: 'Recém-formada, mas cheia de vontade!',
  },
  {
    id: 'intern-joao',
    name: 'João Pedro',
    rarity: 'intern',
    portrait: '👨‍💼',
    multiplier: { type: 'profit', value: 0.03 },
    flavor: 'Formado pelo SENAC. Sonha em ser gerente.',
  },
  {
    id: 'intern-ana',
    name: 'Ana Clara',
    rarity: 'intern',
    portrait: '👩‍🎓',
    multiplier: { type: 'click', value: 0.05 },
    flavor: 'Estudante de administração. Mãos ágeis!',
  },
  {
    id: 'intern-lucas',
    name: 'Lucas Henrique',
    rarity: 'intern',
    portrait: '🧑‍💻',
    multiplier: { type: 'profit', value: 0.02, regionId: 'esperanca' },
    flavor: 'Conhece todo mundo em Esperança.',
  },
  {
    id: 'intern-bruna',
    name: 'Bruna Oliveira',
    rarity: 'intern',
    portrait: '👩‍🔧',
    multiplier: { type: 'cost_reduction', value: 0.02 },
    flavor: 'Boa com números. Economiza nos custos!',
  },

  // ========== GERENTES (Manager - 20%) ==========
  {
    id: 'manager-carlos',
    name: 'Carlos Eduardo',
    rarity: 'manager',
    portrait: '🕴️',
    multiplier: { type: 'profit', value: 0.10 },
    flavor: '10 anos de experiência no varejo.',
  },
  {
    id: 'manager-patricia',
    name: 'Patrícia Lima',
    rarity: 'manager',
    portrait: '👩‍💻',
    multiplier: { type: 'profit', value: 0.08, regionId: 'campina-grande' },
    flavor: 'Conhece Campina Grande como ninguém.',
  },
  {
    id: 'manager-roberto',
    name: 'Roberto Almeida',
    rarity: 'manager',
    portrait: '👨‍🏫',
    multiplier: { type: 'cost_reduction', value: 0.07 },
    flavor: 'MBA em gestão. Corta custos com precisão cirúrgica.',
  },
  {
    id: 'manager-fernanda',
    name: 'Fernanda Santos',
    rarity: 'manager',
    portrait: '👩‍🍳',
    multiplier: { type: 'profit', value: 0.12, storeDefinitionId: 'restaurante' },
    flavor: 'Chef premiada. Seus restaurantes bombam!',
  },

  // ========== DIRETORES (Director - 8%) ==========
  {
    id: 'director-ricardo',
    name: 'Ricardo Neves',
    rarity: 'director',
    portrait: '🎩',
    multiplier: { type: 'profit', value: 0.25 },
    flavor: 'Veterano do mercado nordestino. Visão estratégica ímpar.',
  },
  {
    id: 'director-juliana',
    name: 'Juliana Ferreira',
    rarity: 'director',
    portrait: '👑',
    multiplier: { type: 'global', value: 0.15 },
    flavor: 'Administradora renomada. Tudo que toca vira ouro!',
  },
  {
    id: 'director-marcos',
    name: 'Marcos Vinícius',
    rarity: 'director',
    portrait: '🏆',
    multiplier: { type: 'cost_reduction', value: 0.15 },
    flavor: 'Engenheiro de produção. Eficiência máxima.',
  },

  // ========== CEO VISIONÁRIO (CEO - 2%) ==========
  {
    id: 'ceo-dona-rosa',
    name: 'Dona Rosa',
    rarity: 'ceo',
    portrait: '🌟',
    multiplier: { type: 'global', value: 0.50 },
    flavor: 'Lendária matriarca dos negócios do sertão. +50% em TUDO!',
  },
  {
    id: 'ceo-doutor-silva',
    name: 'Doutor Silva',
    rarity: 'ceo',
    portrait: '💎',
    multiplier: { type: 'profit', value: 0.75 },
    flavor: 'Megaempresário. Transformou R$100 em um império.',
  },
];
