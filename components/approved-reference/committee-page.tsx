import { ReferenceSurface } from './surface';
import Design from './committee-design';
import { css } from './committee-style';
export default function Page(){return <ReferenceSurface css={css}><Design/></ReferenceSurface>;}
