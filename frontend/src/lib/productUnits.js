const UNIT_LABELS = { cai: 'cái', bo: 'bộ', tam: 'tấm', chiec: 'chiếc', doi: 'đôi', met: 'mét' }

export function formatProductUnit(unit) {
  const value = unit?.trim() || 'cái'
  return UNIT_LABELS[value.toLowerCase()] || value
}
