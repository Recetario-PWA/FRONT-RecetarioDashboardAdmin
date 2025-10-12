import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo',
  standalone: true,
})
export class TimeAgoPipe implements PipeTransform {

  transform(value: string | Date): string {
    const date = new Date(value);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / 1000;

    const pluralize = (count: number, singular: string, plural?: string) =>
      `${count} ${count === 1 ? singular : (plural || singular + 's')}`;

    if (diff < 60) return `hace ${pluralize(Math.floor(diff), 'segundo')}`;
    if (diff < 3600) return `hace ${pluralize(Math.floor(diff / 60), 'minuto')}`;
    if (diff < 86400) return `hace ${pluralize(Math.floor(diff / 3600), 'hora')}`;
    if (diff < 604800) return `hace ${pluralize(Math.floor(diff / 86400), 'día')}`;
    if (diff < 2629800) return `hace ${pluralize(Math.floor(diff / 604800), 'semana')}`;
    if (diff < 31557600) return `hace ${pluralize(Math.floor(diff / 2629800), 'mes')}`;
    return `hace ${pluralize(Math.floor(diff / 31557600), 'año')}`;
  }
}
