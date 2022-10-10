/* eslint-disable @typescript-eslint/naming-convention */

export interface Category {
    id: number;
    name: string;
    fullname: string;
    level: number;
    root_id: number | null;
    parent_id: number | null;
}
