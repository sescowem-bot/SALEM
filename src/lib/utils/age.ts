/** Display-only age calculation. DOB can remain stored for internal identity/history,\n * while client-facing reports show age as requested. */
export function calculateAge(dob: string | null | undefined, asOf = new Date()): string | null {
  if (!dob) return null;
  const birth = new Date(`${dob}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return null;
  let age = asOf.getFullYear() - birth.getFullYear();
  const month = asOf.getMonth() - birth.getMonth();
  if (month < 0 || (month === 0 && asOf.getDate() < birth.getDate())) age -= 1;
  if (age < 0 || age > 130) return null;
  return `${age}`;
}
