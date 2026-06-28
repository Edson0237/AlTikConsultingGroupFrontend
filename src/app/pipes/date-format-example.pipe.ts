import { Pipe, PipeTransform } from '@angular/core';
import { DateFormatOption } from '../components/parametres/parametres.component';

@Pipe({
    name: 'dateFormatExample',
    standalone: true,
})
export class DateFormatExamplePipe implements PipeTransform {
    /**
     * Retourne l'exemple correspondant au format de date sélectionné.
     * 
     * Usage dans le template :
     * {{ dateFormatOptions | dateFormatExample : systemForm.value.dateFormat }}
     * 
     * @param formats - Tableau des formats disponibles (DateFormatOption[])
     * @param selectedValue - Valeur du format sélectionné (string)
     * @returns L'exemple du format sélectionné, ou le premier exemple si non trouvé
     */
    transform(formats: DateFormatOption[], selectedValue: string): string {
        if (!formats || formats.length === 0) {
            return '';
        }

        if (!selectedValue) {
            return formats[0].example;
        }

        const selected = formats.find(f => f.value === selectedValue);
        return selected ? selected.example : formats[0].example;
    }
}