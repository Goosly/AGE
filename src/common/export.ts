import {Injectable} from '@angular/core';
import {Wcif, EventConfiguration} from './classes';
import {saveAs} from 'file-saver';
declare var pdfMake: any;

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private eventNames = [
    {id: '222', label: '2x2x2 Cube'},
    {id: '333', label: '3x3x3 Cube'},
    {id: '444', label: '4x4x4 Cube'},
    {id: '555', label: '5x5x5 Cube'},
    {id: '666', label: '6x6x6 Cube'},
    {id: '777', label: '7x7x7 Cube'},
    {id: '333bf', label: '3x3x3 Blindfolded'},
    {id: '333oh', label: '3x3x3 One-Handed'},
    {id: '333ft', label: '3x3x3 With Feet'},
    {id: 'clock', label: 'Clock'},
    {id: 'minx', label: 'Megaminx'},
    {id: 'pyram', label: 'Pyraminx'},
    {id: 'skewb', label: 'Skewb'},
    {id: 'sq1', label: 'Square-1'},
    {id: '444bf', label: '4x4x4 Blindfolded'},
    {id: '555bf', label: '5x5x5 Blindfolded'},
    {id: '333mbf', label: '3x3x3 Multi-Blind'},
    {id: '333fm', label: '3x3x3 Fewest Moves'}
  ]
  private formats = [
    {id: 'a', label: 'ao5'},
    {id: 'm', label: 'mo3'},
    {id: '1', label: 'mo3'},
    {id: '2', label: 'mo3'},
    {id: '3', label: 'mo3'}
  ]

  constructor() {}

  csvGroupAndTaskAssignments(wcif: Wcif) {
    let csv:string = 'Name,' + wcif.events.map(event => event.id).join(',') + '\r\n';
    wcif.persons.forEach(p => {
      csv += (p.name + ',');
      csv += wcif.events.map(event => p[event.id].group).join(',');
      csv += '\r\n';
    });

    let filename = 'groupAndTaskAssignments-' + wcif.id + '.csv';
    this.downloadFile(csv, filename);
  }

  csvGroups(wcif: Wcif) {
    let csv:string = 'Name,' + wcif.events.map(event => event.id).join(',') + '\r\n';
    wcif.persons.forEach(p => {
      csv += (p.name + ',');
      csv += wcif.events.map(event => p[event.id].group.split(';')[0]).join(',');
      csv += '\r\n';
    });

    let filename = 'groups-' + wcif.id + '.csv';
    this.downloadFile(csv, filename);
  }

  csvEvents(wcif: Wcif) {
    let csv: string = 'event,label,format,limit,cumulative,cutoff,\r\n';
    wcif.events.forEach(e => {
      let label = this.eventNames.filter(f => f.id === e.id)[0].label;
      let format = this.formats.filter(f => f.id === e.round1.format)[0].label;
      let limit: string = ! e.round1.timeLimit ? '' : this.centisToMinutesAndSeconds(e.round1.timeLimit.centiseconds);
      let cumulative: boolean = !! e.round1.timeLimit && e.round1.timeLimit.cumulativeRoundIds.length;
      let cutoff: string = ! e.round1.cutoff ? '' : this.centisToMinutesAndSeconds(e.round1.cutoff.attemptResult);

      csv += (e.id + ',');
      csv += (label + ',');
      csv += (format + ',');
      csv += (limit + ',');
      csv += ((cumulative ? 'yes' : 'no') + ',');
      csv += (cutoff + ',');
      csv += '\r\n';
    });

    let filename = 'events-' + wcif.id + '.csv';
    this.downloadFile(csv, filename);
  }

  private centisToMinutesAndSeconds(centiseconds) {
    if (! centiseconds) {
      return '';
    }
    var minutes = Math.floor(centiseconds / 6000);
    var seconds = Math.floor((centiseconds % 6000) / 100);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds + (centiseconds % 100 === 0 ? '' : ('.' + centiseconds % 100));
  }

  pdfGroupOverview(wcif: Wcif) {
    var document = {
      content: [
      ],
      styles: {
      },
      defaultStyle: {
        fontSize: 11,
      }
    }

    wcif.events.forEach(event => {
      let configuration: EventConfiguration = event.configuration;
      if (configuration.skip) {
        return;
      }
      let groups: number = configuration.scrambleGroups * configuration.stages;
      for (let i = 1; i <= groups; i++) {
        // For every group, collect all competitors, judges, scramblers and runners
        let competitors = wcif.persons.filter(p => p[event.id].group.split(';')[0] === ('' + i));
        let judges = wcif.persons.filter(p => p[event.id].group.indexOf(';') > -1 && p[event.id].group.split(';')[1].indexOf('J' + i) > -1);
        let scramblers = wcif.persons.filter(p => p[event.id].group.indexOf(';') > -1 && p[event.id].group.split(';')[1].indexOf('S' + i) > -1);
        let runners = wcif.persons.filter(p => p[event.id].group.indexOf(';') > -1 && p[event.id].group.split(';')[1].indexOf('R' + i) > -1);

        // Write information to pdf
        var groupSummary: string = event.id + ' - group ' + i +  ' has ' + competitors.length + ' competitors, ' + judges.length + ' judges, '
            + scramblers.length + ' scramblers and ' + runners.length + ' runners\n';
        groupSummary += 'Competitors: ' + competitors.map(p => p.name).join(', ') + '\n';
        groupSummary += 'Judges: ' + judges.map(p => p.name).join(', ') + '\n';
        groupSummary += 'Scramblers: ' + scramblers.map(p => p.name).join(', ') + '\n';
        groupSummary += 'Runners: ' + runners.map(p => p.name).join(', ') + '\n';
        groupSummary += '\n';
        document.content.push(
          {
            text: groupSummary,
            unbreakable: true
          }
        );
      }
      document.content.push('\n\n');
    });

    let filename = 'namesPerGroupOverview-' + wcif.id + '.pdf';
    pdfMake.createPdf(document).download(filename);
  }

  pdfTableGroupAndTaskAssignments(wcif: Wcif) {
    var document = {
      pageOrientation: 'landscape',
      content: [
        {
          style: 'tableOverview',
          table: {
            headerRows: 1,
            paddingLeft: function(i, node) { return 0; },
            paddingRight: function(i, node) { return 0; },
            paddingTop: function(i, node) { return 2; },
            paddingBottom: function(i, node) { return 2; },
            body: []
          },
          layout: 'lightHorizontalLines'
        },
      ],
      styles: {
        tableOverview: {
          lineHeight: 0.7
        }
      },
      defaultStyle: {
        fontSize: 9,
      }
    }

    document.content[0].table.body.push(['Name']);
    wcif.events.forEach(event => {
      document.content[0].table.body[0].push(event.id);
    });
    wcif.persons.forEach(p => {
      let array = [p.name];
      wcif.events.forEach(event => {
        array.push(p[event.id].group);
      });
      document.content[0].table.body.push(array);
    });

    let filename = 'tableOverview-' + wcif.id + '.pdf';
    pdfMake.createPdf(document).download(filename);
  }

  csvForCubeComps(wcif: Wcif) {
    let csv:string = 'Status,Name,Country,WCA ID,Birth Date,Gender,' + wcif.events.map(event => event.id).join(',') + ',Email,Guests,IP' + '\r\n';
    wcif.persons.forEach(p => {
      csv += ('a,');
      csv += (p.name + ',');
      csv += (this.getCountryName(p.countryIso2) + ',');
      csv += (p.wcaId + ',');
      csv += (p.birthdate + ',');
      csv += (p.gender + ',');
      csv += wcif.events.map(event => (p[event.id].competing ? '1' : '0')).join(',');
      csv += (p.email + ',');
      csv += (p.guests + ',');
      csv += ('"",');
      csv += '\r\n';
    });

    let filename = 'cubeComps-' + wcif.id + '.csv';
    this.downloadFile(csv, filename);
  }

  private downloadFile(data: string, filename: string){
    var blob = new Blob([data]);
    saveAs(blob, filename);
  }




  // TODO Alternative?
  private isoCountries = {
    'AF' : 'Afghanistan',
    'AX' : 'Aland Islands',
    'AL' : 'Albania',
    'DZ' : 'Algeria',
    'AS' : 'American Samoa',
    'AD' : 'Andorra',
    'AO' : 'Angola',
    'AI' : 'Anguilla',
    'AQ' : 'Antarctica',
    'AG' : 'Antigua And Barbuda',
    'AR' : 'Argentina',
    'AM' : 'Armenia',
    'AW' : 'Aruba',
    'AU' : 'Australia',
    'AT' : 'Austria',
    'AZ' : 'Azerbaijan',
    'BS' : 'Bahamas',
    'BH' : 'Bahrain',
    'BD' : 'Bangladesh',
    'BB' : 'Barbados',
    'BY' : 'Belarus',
    'BE' : 'Belgium',
    'BZ' : 'Belize',
    'BJ' : 'Benin',
    'BM' : 'Bermuda',
    'BT' : 'Bhutan',
    'BO' : 'Bolivia',
    'BA' : 'Bosnia And Herzegovina',
    'BW' : 'Botswana',
    'BV' : 'Bouvet Island',
    'BR' : 'Brazil',
    'IO' : 'British Indian Ocean Territory',
    'BN' : 'Brunei Darussalam',
    'BG' : 'Bulgaria',
    'BF' : 'Burkina Faso',
    'BI' : 'Burundi',
    'KH' : 'Cambodia',
    'CM' : 'Cameroon',
    'CA' : 'Canada',
    'CV' : 'Cape Verde',
    'KY' : 'Cayman Islands',
    'CF' : 'Central African Republic',
    'TD' : 'Chad',
    'CL' : 'Chile',
    'CN' : 'China',
    'CX' : 'Christmas Island',
    'CC' : 'Cocos (Keeling) Islands',
    'CO' : 'Colombia',
    'KM' : 'Comoros',
    'CG' : 'Congo',
    'CD' : 'Congo, Democratic Republic',
    'CK' : 'Cook Islands',
    'CR' : 'Costa Rica',
    'CI' : 'Cote D\'Ivoire',
    'HR' : 'Croatia',
    'CU' : 'Cuba',
    'CY' : 'Cyprus',
    'CZ' : 'Czech Republic',
    'DK' : 'Denmark',
    'DJ' : 'Djibouti',
    'DM' : 'Dominica',
    'DO' : 'Dominican Republic',
    'EC' : 'Ecuador',
    'EG' : 'Egypt',
    'SV' : 'El Salvador',
    'GQ' : 'Equatorial Guinea',
    'ER' : 'Eritrea',
    'EE' : 'Estonia',
    'ET' : 'Ethiopia',
    'FK' : 'Falkland Islands (Malvinas)',
    'FO' : 'Faroe Islands',
    'FJ' : 'Fiji',
    'FI' : 'Finland',
    'FR' : 'France',
    'GF' : 'French Guiana',
    'PF' : 'French Polynesia',
    'TF' : 'French Southern Territories',
    'GA' : 'Gabon',
    'GM' : 'Gambia',
    'GE' : 'Georgia',
    'DE' : 'Germany',
    'GH' : 'Ghana',
    'GI' : 'Gibraltar',
    'GR' : 'Greece',
    'GL' : 'Greenland',
    'GD' : 'Grenada',
    'GP' : 'Guadeloupe',
    'GU' : 'Guam',
    'GT' : 'Guatemala',
    'GG' : 'Guernsey',
    'GN' : 'Guinea',
    'GW' : 'Guinea-Bissau',
    'GY' : 'Guyana',
    'HT' : 'Haiti',
    'HM' : 'Heard Island & Mcdonald Islands',
    'VA' : 'Holy See (Vatican City State)',
    'HN' : 'Honduras',
    'HK' : 'Hong Kong',
    'HU' : 'Hungary',
    'IS' : 'Iceland',
    'IN' : 'India',
    'ID' : 'Indonesia',
    'IR' : 'Iran, Islamic Republic Of',
    'IQ' : 'Iraq',
    'IE' : 'Ireland',
    'IM' : 'Isle Of Man',
    'IL' : 'Israel',
    'IT' : 'Italy',
    'JM' : 'Jamaica',
    'JP' : 'Japan',
    'JE' : 'Jersey',
    'JO' : 'Jordan',
    'KZ' : 'Kazakhstan',
    'KE' : 'Kenya',
    'KI' : 'Kiribati',
    'KR' : 'Korea',
    'KW' : 'Kuwait',
    'KG' : 'Kyrgyzstan',
    'LA' : 'Lao People\'s Democratic Republic',
    'LV' : 'Latvia',
    'LB' : 'Lebanon',
    'LS' : 'Lesotho',
    'LR' : 'Liberia',
    'LY' : 'Libyan Arab Jamahiriya',
    'LI' : 'Liechtenstein',
    'LT' : 'Lithuania',
    'LU' : 'Luxembourg',
    'MO' : 'Macao',
    'MK' : 'Macedonia',
    'MG' : 'Madagascar',
    'MW' : 'Malawi',
    'MY' : 'Malaysia',
    'MV' : 'Maldives',
    'ML' : 'Mali',
    'MT' : 'Malta',
    'MH' : 'Marshall Islands',
    'MQ' : 'Martinique',
    'MR' : 'Mauritania',
    'MU' : 'Mauritius',
    'YT' : 'Mayotte',
    'MX' : 'Mexico',
    'FM' : 'Micronesia, Federated States Of',
    'MD' : 'Moldova',
    'MC' : 'Monaco',
    'MN' : 'Mongolia',
    'ME' : 'Montenegro',
    'MS' : 'Montserrat',
    'MA' : 'Morocco',
    'MZ' : 'Mozambique',
    'MM' : 'Myanmar',
    'NA' : 'Namibia',
    'NR' : 'Nauru',
    'NP' : 'Nepal',
    'NL' : 'Netherlands',
    'AN' : 'Netherlands Antilles',
    'NC' : 'New Caledonia',
    'NZ' : 'New Zealand',
    'NI' : 'Nicaragua',
    'NE' : 'Niger',
    'NG' : 'Nigeria',
    'NU' : 'Niue',
    'NF' : 'Norfolk Island',
    'MP' : 'Northern Mariana Islands',
    'NO' : 'Norway',
    'OM' : 'Oman',
    'PK' : 'Pakistan',
    'PW' : 'Palau',
    'PS' : 'Palestinian Territory, Occupied',
    'PA' : 'Panama',
    'PG' : 'Papua New Guinea',
    'PY' : 'Paraguay',
    'PE' : 'Peru',
    'PH' : 'Philippines',
    'PN' : 'Pitcairn',
    'PL' : 'Poland',
    'PT' : 'Portugal',
    'PR' : 'Puerto Rico',
    'QA' : 'Qatar',
    'RE' : 'Reunion',
    'RO' : 'Romania',
    'RU' : 'Russian Federation',
    'RW' : 'Rwanda',
    'BL' : 'Saint Barthelemy',
    'SH' : 'Saint Helena',
    'KN' : 'Saint Kitts And Nevis',
    'LC' : 'Saint Lucia',
    'MF' : 'Saint Martin',
    'PM' : 'Saint Pierre And Miquelon',
    'VC' : 'Saint Vincent And Grenadines',
    'WS' : 'Samoa',
    'SM' : 'San Marino',
    'ST' : 'Sao Tome And Principe',
    'SA' : 'Saudi Arabia',
    'SN' : 'Senegal',
    'RS' : 'Serbia',
    'SC' : 'Seychelles',
    'SL' : 'Sierra Leone',
    'SG' : 'Singapore',
    'SK' : 'Slovakia',
    'SI' : 'Slovenia',
    'SB' : 'Solomon Islands',
    'SO' : 'Somalia',
    'ZA' : 'South Africa',
    'GS' : 'South Georgia And Sandwich Isl.',
    'ES' : 'Spain',
    'LK' : 'Sri Lanka',
    'SD' : 'Sudan',
    'SR' : 'Suriname',
    'SJ' : 'Svalbard And Jan Mayen',
    'SZ' : 'Swaziland',
    'SE' : 'Sweden',
    'CH' : 'Switzerland',
    'SY' : 'Syrian Arab Republic',
    'TW' : 'Taiwan',
    'TJ' : 'Tajikistan',
    'TZ' : 'Tanzania',
    'TH' : 'Thailand',
    'TL' : 'Timor-Leste',
    'TG' : 'Togo',
    'TK' : 'Tokelau',
    'TO' : 'Tonga',
    'TT' : 'Trinidad And Tobago',
    'TN' : 'Tunisia',
    'TR' : 'Turkey',
    'TM' : 'Turkmenistan',
    'TC' : 'Turks And Caicos Islands',
    'TV' : 'Tuvalu',
    'UG' : 'Uganda',
    'UA' : 'Ukraine',
    'AE' : 'United Arab Emirates',
    'GB' : 'United Kingdom',
    'US' : 'United States',
    'UM' : 'United States Outlying Islands',
    'UY' : 'Uruguay',
    'UZ' : 'Uzbekistan',
    'VU' : 'Vanuatu',
    'VE' : 'Venezuela',
    'VN' : 'Viet Nam',
    'VG' : 'Virgin Islands, British',
    'VI' : 'Virgin Islands, U.S.',
    'WF' : 'Wallis And Futuna',
    'EH' : 'Western Sahara',
    'YE' : 'Yemen',
    'ZM' : 'Zambia',
    'ZW' : 'Zimbabwe'
  };

  private getCountryName(countryCode: string): string {
      if (this.isoCountries.hasOwnProperty(countryCode)) {
          return this.isoCountries[countryCode];
      } else {
          return countryCode;
      }
  }
}
