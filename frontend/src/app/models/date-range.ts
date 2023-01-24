import { TuiDay } from "@taiga-ui/cdk";

export enum RangeType {
    Custom = 0,
    Month,
    Year
}

export class DateRange {
    constructor(readonly name: string, readonly from: TuiDay, readonly to: TuiDay, readonly type: RangeType = RangeType.Custom) {
    }

    static last30(): DateRange {
        return new DateRange("Last 30 days", TuiDay.currentLocal().append({ day: -30 }), TuiDay.currentLocal(), RangeType.Custom);
    }

    static last90(): DateRange {
        return new DateRange("Last 3 Months", TuiDay.currentLocal().append({ month: -3 }), TuiDay.currentLocal(), RangeType.Custom);
    }

    static lastYear(): DateRange {
        const now = TuiDay.currentLocal();
        return new DateRange("Last Year", TuiDay.currentLocal().append({ year: -1 }), TuiDay.currentLocal(), RangeType.Custom);
    }

    static month(): DateRange {
        const now = TuiDay.currentLocal();
        return new DateRange(now.toLocalNativeDate().toLocaleString('default', { month: 'long' }), new TuiDay(now.year, now.month, 1), now, RangeType.Month);
    }

    static year(): DateRange {
        const now = TuiDay.currentLocal();
        return new DateRange(now.year.toString(), new TuiDay(now.year, 0, 1), now, RangeType.Year);
    }

    hasPrev(): boolean {
        return this.type == RangeType.Year || this.type == RangeType.Month;
    }

    prev(): DateRange {
        if (this.type == RangeType.Year) {
            const from = this.from.append({year: -1});
            const to = new TuiDay(from.year, 11, 31);
            return new DateRange(from.year.toString(), from, to, RangeType.Year);
        }  else if (this.type == RangeType.Month) {
            const from = this.from.append({month: -1});
            const to = new TuiDay(from.year, from.month, from.daysCount);
            return new DateRange(from.toLocalNativeDate().toLocaleString('default', { month: 'long' }), from, to, RangeType.Month);
        }
        return this;
    }

    hasNext(): boolean {
        return (this.type == RangeType.Year || this.type == RangeType.Month) && this.to.dayBefore(TuiDay.currentLocal());
    }

    next(): DateRange {
        if (!this.hasNext()) {
            return this;
        }
        const from = this.type == RangeType.Year ? this.from.append({year: 1}) : this.from.append({month: 1});
        let to = this.type == RangeType.Year ? new TuiDay(from.year, 11, 31) : new TuiDay(from.year, from.month, from.daysCount);
        if (to.dayAfter(TuiDay.currentLocal())) {
            to = TuiDay.currentLocal();
        }
        const name = this.type == RangeType.Year ? from.year.toString() : from.toLocalNativeDate().toLocaleString('default', { month: 'long' });
        return new DateRange(name, from, to, this.type);
    }

    same(another: DateRange): boolean {
        return this.name == another.name && this.from.daySame(another.from) && this.to.daySame(another.to);
    }
}