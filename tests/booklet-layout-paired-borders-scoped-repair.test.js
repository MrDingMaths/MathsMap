import {repairPairedBorders,PROJECTS} from '../scripts/booklet/repair-paired-borders-scoped-20261004.mjs';
import {registerRepairTests} from './helpers/layout-repair-20261004.mjs';
registerRepairTests('paired-borders-scoped',repairPairedBorders,PROJECTS);
