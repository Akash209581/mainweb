export const metadata = {"title":"Conference Registration | Hansci Novum","description":"Explore Hansci Novum conference registration: select your category, enter participant details and review your registration."};
import { HtmlReferencePage } from '@/components/approved-reference/html-page';
import { source } from '@/components/approved-reference/registration-source';
import { registrationCountries } from '@/components/approved-reference/registration-data';
export default async function Page(){return <HtmlReferencePage source={source} countries={await registrationCountries()}/>;}
