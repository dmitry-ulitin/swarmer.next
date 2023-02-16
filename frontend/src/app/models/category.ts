/* eslint-disable @typescript-eslint/naming-convention */

import { TransactionType } from "./transaction";

export interface Category {
    id: number | null;
    name: string;
    fullname: string;
    level: number;
    type: TransactionType;
    parent_id: number | null;
}
