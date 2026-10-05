import {repairMeanAlignment,PROJECTS} from '../scripts/booklet/repair-mean-alignment-20261004.mjs';
import {registerRepairTests} from './helpers/layout-repair-20261004.mjs';
registerRepairTests('mean-alignment',repairMeanAlignment,PROJECTS);
