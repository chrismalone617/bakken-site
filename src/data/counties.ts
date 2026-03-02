/** County data for Bakken Shale county pages. Courthouse info from courthouse-directory. */
export interface CountyInfo {
  slug: string;
  name: string;
  state: 'ND' | 'MT';
  courthouse?: {
    address: string;
    city: string;
    state: string;
    zip: string;
    tel: string;
    mapUrl: string;
  };
}

export const COUNTIES: CountyInfo[] = [
  { slug: 'billings-county-nd', name: 'Billings County', state: 'ND', courthouse: { address: '495 4th St', city: 'Medora', state: 'ND', zip: '58645', tel: '(701) 623-4491', mapUrl: 'https://www.google.com/maps/place/Billings+County+Court+Recorder/@46.9132101,-103.5247071,17z' } },
  { slug: 'bottineau-county-nd', name: 'Bottineau County', state: 'ND', courthouse: { address: '314 5th St W', city: 'Bottineau', state: 'ND', zip: '58318', tel: '(701) 228-3618', mapUrl: 'https://www.google.com/maps/place/Bottineau+County+District+Court/@48.827338,-100.449515,17z' } },
  { slug: 'bowman-county-nd', name: 'Bowman County', state: 'ND', courthouse: { address: '104 E Broadway', city: 'Bowman', state: 'ND', zip: '58623', tel: '(701) 523-3650', mapUrl: 'https://www.google.com/maps/search/Bowman+County+Courthouse+ND' } },
  { slug: 'burke-county-nd', name: 'Burke County', state: 'ND', courthouse: { address: '103 Main St', city: 'Bowbells', state: 'ND', zip: '58721', tel: '(701) 377-2818', mapUrl: 'https://www.google.com/maps/place/Burke+County+Register+of+Deeds/@48.5754635,-102.2909255,9z' } },
  { slug: 'divide-county-nd', name: 'Divide County', state: 'ND', courthouse: { address: '300 N Main St', city: 'Crosby', state: 'ND', zip: '58730', tel: '(701) 965-6831', mapUrl: 'https://www.google.com/maps/place/Divide+County+Clerk+of+Court/@48.917924,-103.293867,17z' } },
  { slug: 'dunn-county-nd', name: 'Dunn County', state: 'ND', courthouse: { address: '205 Owens St', city: 'Manning', state: 'ND', zip: '58642', tel: '(701) 573-4447', mapUrl: 'https://www.google.com/maps/place/Dunn+County+Clerk+of+Courts/@47.601423,-103.1977525,8z' } },
  { slug: 'golden-valley-county-nd', name: 'Golden Valley County', state: 'ND', courthouse: { address: '150 1st Ave SE', city: 'Beach', state: 'ND', zip: '58621', tel: '(701) 872-3713', mapUrl: 'https://www.google.com/maps/place/Golden+Valley+County+Recorder/@46.912894,-104.004732,17z' } },
  { slug: 'mchenry-county-nd', name: 'McHenry County', state: 'ND', courthouse: { address: '407 Main St S', city: 'Towner', state: 'ND', zip: '58788', tel: '(701) 537-5634', mapUrl: 'https://www.google.com/maps/place/McHenry+County+Clerk+of+Court/@48.342533,-100.405022,17z' } },
  { slug: 'mckenzie-county-nd', name: 'McKenzie County', state: 'ND', courthouse: { address: '201 5th St NW', city: 'Watford City', state: 'ND', zip: '58854', tel: '(701) 444-3616', mapUrl: 'https://www.google.com/maps/place/Mc+Kenzie+County+Recorder/@47.8023243,-103.2771573,14z' } },
  { slug: 'mclean-county-nd', name: 'McLean County', state: 'ND', courthouse: { address: '712 5th Ave', city: 'Washburn', state: 'ND', zip: '58577', tel: '(701) 462-8541', mapUrl: 'https://www.google.com/maps/place/McLean+County+Court+House/@47.290758,-101.026576,17z' } },
  { slug: 'mountrail-county-nd', name: 'Mountrail County', state: 'ND', courthouse: { address: '101 N Main St', city: 'Stanley', state: 'ND', zip: '58784', tel: '(701) 628-2915', mapUrl: 'https://www.google.com/maps/place/Mountrail+Clerk-District+Court/@48.321957,-102.390773,17z' } },
  { slug: 'renville-county-nd', name: 'Renville County', state: 'ND', courthouse: { address: '205 Main St E', city: 'Mohall', state: 'ND', zip: '58761', tel: '(701) 756-6398', mapUrl: 'https://www.google.com/maps/place/Renville+County+Recorder/@48.867686,-101.570452,17z' } },
  { slug: 'slope-county-nd', name: 'Slope County', state: 'ND', courthouse: { address: '206 Main St', city: 'Amidon', state: 'ND', zip: '58620', tel: '(701) 879-6275', mapUrl: 'https://www.google.com/maps/search/Slope+County+Courthouse+ND' } },
  { slug: 'stark-county-nd', name: 'Stark County', state: 'ND', courthouse: { address: '51 3rd St E', city: 'Dickinson', state: 'ND', zip: '58601', tel: '(701) 456-7620', mapUrl: 'https://www.google.com/maps/place/District+Court/@46.885285,-102.8082385,14z' } },
  { slug: 'ward-county-nd', name: 'Ward County', state: 'ND', courthouse: { address: '315 3rd St SE', city: 'Minot', state: 'ND', zip: '58701', tel: '(701) 857-6600', mapUrl: 'https://www.google.com/maps/place/Clerk+of+District+Court+Office/@48.2468625,-101.286776,14z' } },
  { slug: 'williams-county-nd', name: 'Williams County', state: 'ND', courthouse: { address: '205 E Broadway', city: 'Williston', state: 'ND', zip: '58801', tel: '(701) 774-4375', mapUrl: 'https://www.google.com/maps/place/Clerk+of+Court/@47.915409,-103.480918,8z' } },
  { slug: 'daniels-county-mt', name: 'Daniels County', state: 'MT', courthouse: { address: '213 Main St', city: 'Scobey', state: 'MT', zip: '59263', tel: '(406) 487-5564', mapUrl: 'https://www.google.com/maps/place/Daniels+County+Clerk+%26+Recorder/@48.590617,-105.841984,10z' } },
  { slug: 'dawson-county-mt', name: 'Dawson County', state: 'MT', courthouse: { address: '207 W Bell St', city: 'Glendive', state: 'MT', zip: '59330', tel: '(406) 377-3967', mapUrl: 'https://www.google.com/maps/place/Dawson+County+Clerk+of+Court/@47.1130545,-104.8024872,11z' } },
  { slug: 'fallon-county-mt', name: 'Fallon County', state: 'MT', courthouse: { address: '10 W Fallon Ave', city: 'Baker', state: 'MT', zip: '59313', tel: '(406) 778-7106', mapUrl: 'https://www.google.com/maps/place/Fallon+County+Treasurer/@46.356842,-104.274574,16z' } },
  { slug: 'garfield-county-mt', name: 'Garfield County', state: 'MT', courthouse: { address: 'Leavitt Ave', city: 'Jordan', state: 'MT', zip: '59337', tel: '(406) 557-6240', mapUrl: 'https://www.google.com/maps/search/Garfield+County+Courthouse+MT' } },
  { slug: 'mccone-county-mt', name: 'McCone County', state: 'MT', courthouse: { address: 'Main St', city: 'Circle', state: 'MT', zip: '59215', tel: '(406) 485-3502', mapUrl: 'https://www.google.com/maps/search/McCone+County+Courthouse+MT' } },
  { slug: 'prairie-county-mt', name: 'Prairie County', state: 'MT', courthouse: { address: 'Main St', city: 'Terry', state: 'MT', zip: '59349', tel: '(406) 635-5545', mapUrl: 'https://www.google.com/maps/search/Prairie+County+Courthouse+MT' } },
  { slug: 'richland-county-mt', name: 'Richland County', state: 'MT', courthouse: { address: '300 12th Ave NW', city: 'Sidney', state: 'MT', zip: '59270', tel: '(406) 433-1709', mapUrl: 'https://www.google.com/maps/place/Richland+County+Clerk-District+Ct/@47.7183935,-104.1820586,12z' } },
  { slug: 'roosevelt-county-mt', name: 'Roosevelt County', state: 'MT', courthouse: { address: '400 2nd Ave S', city: 'Wolf Point', state: 'MT', zip: '59201', tel: '(406) 653-6250', mapUrl: 'https://www.google.com/maps/place/Roosevelt+County+Recorder/@48.2970639,-104.9492793,9z' } },
  { slug: 'sheridan-county-mt', name: 'Sheridan County', state: 'MT', courthouse: { address: '100 W Laurel Ave', city: 'Plentywood', state: 'MT', zip: '59254', tel: '(406) 765-3404', mapUrl: 'https://www.google.com/maps/place/Sheridan+Clerk-District+Court/@48.778,-104.556774,17z' } },
  { slug: 'valley-county-mt', name: 'Valley County', state: 'MT', courthouse: { address: '501 U.S. 2', city: 'Glasgow', state: 'MT', zip: '59230', tel: '(406) 228-4321', mapUrl: 'https://www.google.com/maps/place/Valley+County+Clerk+of+Court/@48.19263,-106.6381285,18z' } },
  { slug: 'wibaux-county-mt', name: 'Wibaux County', state: 'MT', courthouse: { address: '203 S Wibaux St', city: 'Wibaux', state: 'MT', zip: '59353', tel: '(406) 796-2481', mapUrl: 'https://www.google.com/maps/place/Wibaux+County+Clerk+%26+Recorder/@47.0033158,-104.3243213,9z' } },
];
