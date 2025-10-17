
export interface ContactInfo {
  id: string;
  avatarUrl: string;
  name: string;
  title: string;
  email: string;
  whatsApp: string;
  behanceUrl: string;
  linkedinUrl: string;
  fiverrUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  twitterUrl: string;
}

export const defaultContactInfo: Omit<ContactInfo, 'id'> = {
  avatarUrl: 'https://picsum.photos/seed/hicham/200/200',
  name: 'Hicham Eljabbary',
  title: 'Motion Graphics Designer',
  email: 'hicham@gmail.com',
  whatsApp: '+212 619 665 220',
  behanceUrl: '#',
  linkedinUrl: '#',
  fiverrUrl: '#',
  instagramUrl: '#',
  facebookUrl: '#',
  twitterUrl: '#',
};
