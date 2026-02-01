
import { Course } from './types';

export const COURSES: Course[] = [
  {
    id: '1',
    title: 'Mastering React & TypeScript',
    description: 'Aprenda a construir aplicações escaláveis com React 18 e o poder do TypeScript do zero ao avançado.',
    instructor: 'Alex Silva',
    price: 197.90,
    thumbnail: 'https://picsum.photos/seed/react/800/450',
    rating: 4.8,
    students: 1240,
    modules: [
      {
        id: 'm1',
        title: 'Introdução ao Ecossistema',
        lessons: [
          { id: 'l1', title: 'Bem-vindo ao curso', duration: '05:20', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Visão geral do que vamos aprender.' },
          { id: 'l2', title: 'Configurando o Ambiente', duration: '12:45', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Node, NPM e VS Code setup.' },
        ]
      },
      {
        id: 'm2',
        title: 'Hooks e State Management',
        lessons: [
          { id: 'l3', title: 'Entendendo useState', duration: '15:10', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Gerenciamento básico de estado.' },
          { id: 'l4', title: 'O poder do useEffect', duration: '20:30', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Ciclo de vida e efeitos colaterais.' },
        ]
      }
    ]
  },
  {
    id: '2',
    title: 'UI/UX Design for Developers',
    description: 'Transforme suas aplicações em produtos visualmente atraentes e com usabilidade de nível internacional.',
    instructor: 'Julia Rocha',
    price: 149.90,
    thumbnail: 'https://picsum.photos/seed/uiux/800/450',
    rating: 4.9,
    students: 850,
    modules: [
      {
        id: 'm1',
        title: 'Fundamentos do Design',
        lessons: [
          { id: 'l1', title: 'Tipografia e Hierarquia', duration: '10:00', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Como escolher fontes.' },
        ]
      }
    ]
  },
  {
    id: '3',
    title: 'Python para Data Science',
    description: 'Domine Pandas, Numpy e Matplotlib para análise de dados realística.',
    instructor: 'Dr. Roberto Santos',
    price: 247.00,
    thumbnail: 'https://picsum.photos/seed/data/800/450',
    rating: 4.7,
    students: 2100,
    modules: [
      {
        id: 'm1',
        title: 'Primeiros passos com Pandas',
        lessons: [
          { id: 'l1', title: 'Dataframes explicados', duration: '18:40', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', description: 'Estruturas de dados básicas.' },
        ]
      }
    ]
  }
];
