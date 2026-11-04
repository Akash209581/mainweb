export const metadata = {"title":"Conference Registration | ICGIT 2026","description":"Explore ICGIT 2026 conference registration: select your category, enter participant details and review your registration."};
import { HtmlReferencePage } from '@/components/approved-reference/html-page';
import { source } from '@/components/approved-reference/registration-source';
import { registrationCountries } from '@/components/approved-reference/registration-data';
export default async function Page(){return <HtmlReferencePage source={source} countries={await registrationCountries()}/>;}
