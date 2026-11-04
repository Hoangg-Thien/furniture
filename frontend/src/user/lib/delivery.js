// shortcut: province names follow the checkout catalog, update these groups when that catalog changes.
const REGIONS = [
  { name: 'Miền Bắc', days: [4, 5], provinces: 'ha noi|hai phong|bac giang|bac kan|bac ninh|cao bang|dien bien|ha giang|ha nam|hai duong|hoa binh|hung yen|lai chau|lang son|lao cai|nam dinh|ninh binh|phu tho|quang ninh|son la|thai binh|thai nguyen|tuyen quang|vinh phuc|yen bai'.split('|') },
  { name: 'Miền Trung và Tây Nguyên', days: [2, 3], provinces: 'thanh hoa|nghe an|ha tinh|quang binh|quang tri|thua thien hue|hue|da nang|quang nam|quang ngai|binh dinh|phu yen|khanh hoa|ninh thuan|binh thuan|kon tum|gia lai|dak lak|dak nong|lam dong'.split('|') },
  { name: 'Miền Nam', days: [2, 3], provinces: 'binh duong|dong nai|ba ria - vung tau|binh phuoc|tay ninh|long an|tien giang|ben tre|tra vinh|vinh long|dong thap|an giang|kien giang|can tho|hau giang|soc trang|bac lieu|ca mau'.split('|') },
  { name: 'TP. Hồ Chí Minh', days: [1, 2], provinces: ['ho chi minh', 'hcm', 'sai gon'] },
]

export function getDeliveryEstimate(approvedAt, address) {
  if (typeof approvedAt !== 'string' || typeof address !== 'string') return null
  const approved = Date.parse(approvedAt)
  if (!Number.isFinite(approved)) return null
  const city = address.split(',').at(-1).trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/^(tinh|thanh pho|tp\.?)[\s.]*/, '')
  const region = REGIONS.find(region => region.provinces.includes(city))
  if (!region) return null
  const date = new Date(approved + 7 * 60 * 60 * 1000)
  date.setUTCHours(0, 0, 0, 0)
  const dates = region.days.map(days => new Date(date.getTime() + days * 86400000).toISOString().slice(0, 10))
  return { region: region.name, days: region.days, from: dates[0], to: dates[1] }
}
