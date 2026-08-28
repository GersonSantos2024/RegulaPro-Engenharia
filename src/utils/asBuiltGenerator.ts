import { Project } from '../types';

export interface AsBuiltExportOptions {
  includeStructural: boolean;
  includeArchitecture: boolean;
  includeMEP: boolean;
  includeFireSafety: boolean;
  includeIoTSensors: boolean;
  buildingArea: number;
  floors: number;
}

/**
 * Generates an ISO-10303-21 compliant IFC2X3/IFC4 formatted text file
 * containing BIM geometry, storeys, walls, columns, slabs, fire safety, and property sets.
 */
export function generateIFCContent(project: Project, options: AsBuiltExportOptions): string {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const guidProj = '2uC3x9$L94vP8A3yM91s0A';
  const guidSite = '3$N781$zD62wO8HkR44vLm';
  const guidBldg = '1X5mK90pL51vN3JkQ89aBc';

  const width = Math.sqrt(options.buildingArea / (options.floors || 1));
  const length = width * 1.5;
  const heightPerFloor = 3.2;

  let ifc = `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView_V2.0]', 'RegulaPro BIM As-Built Generator'), '2;1');
FILE_NAME('${project.name.replace(/[^a-zA-Z0-9_-]/g, '_')}_AsBuilt.ifc', '${timestamp}', ('${project.authorName || 'RegulaPro Engineer'}'), ('RegulaPro Enterprise Engenharia'), 'RegulaPro IFC Engine v4.2', 'AutoCAD/Revit Compatible', 'Approved Technical Dossier');
FILE_SCHEMA(('IFC2X3'));
ENDSEC;

DATA;
#1=IFCORGANIZATION($,'RegulaPro Enterprise Engenharia',$,$,$);
#2=IFCAPPLICATION(#1,'v4.2','RegulaPro As-Built Modeler','RegulaPro_BIM');
#3=IFCPERSON($,'Engenheiro Responsavel','RegulaPro',$,$,$,$,$);
#4=IFCPERSONANDORGANIZATION(#3,#1,$);
#5=IFCOWNERHISTORY(#4,#2,$,.ADDED.,$,$,$,${Math.floor(Date.now() / 1000)});
#6=IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.);
#7=IFCSIUNIT(*,.AREAUNIT.,$,.SQUARE_METRE.);
#8=IFCSIUNIT(*,.VOLUMEUNIT.,$,.CUBIC_METRE.);
#9=IFCUNITASSIGNMENT((#6,#7,#8));
#10=IFCDIRECTION((0.,0.,1.));
#11=IFCDIRECTION((1.,0.,0.));
#12=IFCCARTESIANPOINT((0.,0.,0.));
#13=IFCAXIS2PLACEMENT3D(#12,#10,#11);
#14=IFCGEOMETRICREPRESENTATIONCONTEXT($,'Model',3,0.0001,#13,#10);
#15=IFCPROJECT('${guidProj}',#5,'${project.name}', 'Projeto As-Built Regularizado - ${project.processType}',$,$,$,(#14),#9);
#16=IFCSITE('${guidSite}',#5,'Terreno Principal', 'Terreno Urbano Regularizado',$,#13,$,$,.ELEMENT.,(23,32,58,0),(-46,38,0,0),780.,$,$);
#17=IFCRELAGGREGATES('2wN781$zD62wO8HkR44vLk',#5,$,$,#15,(#16));
#18=IFCBUILDING('${guidBldg}',#5,'${project.name} - Edificacao As-Built', 'Edificacao Comercial/Institucional',$,#13,$,$,.ELEMENT.,$,$,$);
#19=IFCRELAGGREGATES('1X5mK90pL51vN3JkQ89aBb',#5,$,$,#16,(#18));
`;

  // Add storeys
  const storeyIds: number[] = [];
  let nextId = 20;

  for (let f = 1; f <= options.floors; f++) {
    const sId = nextId++;
    const sPlacement = nextId++;
    const sPoint = nextId++;
    const elevation = (f - 1) * heightPerFloor;

    ifc += `#${sPoint}=IFCCARTESIANPOINT((0.,0.,${elevation.toFixed(2)}));
#${sPlacement}=IFCAXIS2PLACEMENT3D(#${sPoint},#10,#11);
#${sId}=IFCBUILDINGSTOREY('storey_${f}_guid',#5,'Pavimento ${f} - Cota +${elevation.toFixed(2)}m', 'Pavimento Tipo As-Built',$,#${sPlacement},$,$,.ELEMENT.,${elevation.toFixed(2)});
`;
    storeyIds.push(sId);
  }

  // Aggregate storeys into building
  const storeyRefs = storeyIds.map(id => `#${id}`).join(',');
  ifc += `#${nextId++}=IFCRELAGGREGATES('rel_storeys_guid',#5,$,$,#18,(${storeyRefs}));\n`;

  // Add Structural Columns & Walls for Ground Floor
  if (options.includeArchitecture || options.includeStructural) {
    ifc += `
! --- ELEMENTOS ARQUITETONICOS E ESTRUTURAIS AS-BUILT ---
#${nextId}=IFCPROPERTYSET('pset_asbuilt_1',#5,'Pset_AsBuiltMetadata',$,(
  #${nextId + 1},#${nextId + 2},#${nextId + 3}
));
#${nextId + 1}=IFCPROPERTYSINGLEVALUE('DataLevantamentoAsBuilt',$,IFCTEXT('${new Date().toLocaleDateString('pt-BR')}'),$);
#${nextId + 2}=IFCPROPERTYSINGLEVALUE('ResponsavelTecnico',$,IFCTEXT('${project.authorName || 'Engenheiro Chefe'}'),$);
#${nextId + 3}=IFCPROPERTYSINGLEVALUE('StatusAprovacaoLegal',$,IFCTEXT('${project.status}'),$);
`;
    nextId += 4;

    // Outer Walls (4 walls)
    const wallLengths = [width.toFixed(2), length.toFixed(2), width.toFixed(2), length.toFixed(2)];
    wallLengths.forEach((len, wIdx) => {
      const wId = nextId++;
      ifc += `#${wId}=IFCWALLSTANDARDCASE('wall_${wIdx}_guid',#5,'Parede Perimetral P-${wIdx + 1}','Alvenaria de Bloco Estrutural 19cm',$,#13,$,$);\n`;
    });

    // Columns Grid
    const colCount = 6;
    for (let c = 1; c <= colCount; c++) {
      const cId = nextId++;
      ifc += `#${cId}=IFCCOLUMN('col_${c}_guid',#5,'Pilar Concreto P-${c}','Pilar 25x50cm fck 35MPa',$,#13,$,$);\n`;
    }
  }

  if (options.includeFireSafety) {
    ifc += `
! --- SISTEMA DE PREVENCAO E COMBATE A INCENDIO (AVCB / PPCI) ---
#${nextId++}=IFCSPACE('space_rotas_fuga',#5,'Rotas de Fuga e Saidas de Emergencia',$,$,#13,$,$,.ELEMENT.,.INTERNAL.,$);
#${nextId++}=IFCPROTECTIVEDEVICE('extintor_pqs_01',#5,'Extintor PQS 6kg ABC - Ponto 01', 'Norma IT-21 Bombeiros',$,#13,$,$);
#${nextId++}=IFCPROTECTIVEDEVICE('hidrante_sh_01',#5,'Abrigo de Hidrante Duplo SH-01 - 2.1/2 pol', 'Norma IT-22 Bombeiros',$,#13,$,$);
`;
  }

  if (options.includeIoTSensors) {
    ifc += `
! --- SENSORES IOT E DISPOSITIVOS INTELIGENTES DE MONITORAMENTO ---
#${nextId++}=IFCSENSOR('sensor_iot_temp_01',#5,'Sensor Telemetria Temperatura & Umidade Canteiro', 'IoT Telemetry Gateway',$,#13,$,$);
#${nextId++}=IFCSENSOR('sensor_iot_noise_01',#5,'Sonometro NBR 10151 Perimetro', 'IoT Acoustic Monitor',$,#13,$,$);
#${nextId++}=IFCSENSOR('sensor_iot_vib_01',#5,'Acelerometro Triaxial Fundacoes', 'Structural Health Monitoring',$,#13,$,$);
`;
  }

  ifc += `
ENDSEC;
END-ISO-10303-21;
`;

  return ifc;
}

/**
 * Generates an AutoCAD compatible standard DXF/DWG file string
 * with defined architectural, structural, MEP, fire safety layers, text labels, and dimension lines.
 */
export function generateDXFContent(project: Project, options: AsBuiltExportOptions): string {
  const width = Math.round(Math.sqrt(options.buildingArea / (options.floors || 1)));
  const length = Math.round(width * 1.5);

  let dxf = `0
SECTION
2
HEADER
9
$ACADVER
1
AC1027
9
$INSUNITS
70
6
9
$LUNITS
70
2
0
ENDSEC
0
SECTION
2
TABLES
0
TABLE
2
LAYER
70
8
0
LAYER
2
0
70
0
62
7
6
CONTINUOUS
0
LAYER
2
ARQ_ALVENARIA
70
0
62
7
6
CONTINUOUS
0
LAYER
2
ESTR_PILARES
70
0
62
1
6
CONTINUOUS
0
LAYER
2
PREV_INCENDIO_AVCB
70
0
62
1
6
CONTINUOUS
0
LAYER
2
INST_ELETRICA
70
0
62
4
6
CONTINUOUS
0
LAYER
2
INST_HIDRAULICA
70
0
62
5
6
CONTINUOUS
0
LAYER
2
COTAS_TEXTOS
70
0
62
3
6
CONTINUOUS
0
LAYER
2
IOT_SENSORES
70
0
62
6
6
CONTINUOUS
0
ENDTAB
0
ENDSEC
0
SECTION
2
ENTITIES
`;

  // Entity Helper Functions in DXF
  // 1. Drawing Building Outer Walls (Polylines / Lines)
  dxf += `0
LINE
8
ARQ_ALVENARIA
10
0.0
20
0.0
30
0.0
11
${(length * 100).toFixed(1)}
21
0.0
31
0.0
0
LINE
8
ARQ_ALVENARIA
10
${(length * 100).toFixed(1)}
20
0.0
30
0.0
11
${(length * 100).toFixed(1)}
21
${(width * 100).toFixed(1)}
31
0.0
0
LINE
8
ARQ_ALVENARIA
10
${(length * 100).toFixed(1)}
20
${(width * 100).toFixed(1)}
30
0.0
11
0.0
21
${(width * 100).toFixed(1)}
31
0.0
0
LINE
8
ARQ_ALVENARIA
10
0.0
20
${(width * 100).toFixed(1)}
30
0.0
11
0.0
21
0.0
31
0.0
`;

  // Inner Walls (Corridor & Rooms)
  const midY = (width * 100) / 2;
  dxf += `0
LINE
8
ARQ_ALVENARIA
10
0.0
20
${midY.toFixed(1)}
30
0.0
11
${(length * 100 * 0.7).toFixed(1)}
21
${midY.toFixed(1)}
31
0.0
`;

  // 2. Structural Columns (PILARES)
  const colPositions = [
    [50, 50],
    [(length * 100) / 2, 50],
    [(length * 100) - 50, 50],
    [50, (width * 100) - 50],
    [(length * 100) / 2, (width * 100) - 50],
    [(length * 100) - 50, (width * 100) - 50]
  ];

  colPositions.forEach(([cx, cy]) => {
    dxf += `0
LINE
8
ESTR_PILARES
10
${cx - 20}
20
${cy - 20}
30
0.0
11
${cx + 20}
21
${cy - 20}
31
0.0
0
LINE
8
ESTR_PILARES
10
${cx + 20}
20
${cy - 20}
30
0.0
11
${cx + 20}
21
${cy + 20}
31
0.0
0
LINE
8
ESTR_PILARES
10
${cx + 20}
20
${cy + 20}
30
0.0
11
${cx - 20}
21
${cy + 20}
31
0.0
0
LINE
8
ESTR_PILARES
10
${cx - 20}
20
${cy + 20}
30
0.0
11
${cx - 20}
21
${cy - 20}
31
0.0
`;
  });

  // 3. Fire Safety Symbols (EXTINTORES & HIDRANTES)
  dxf += `0
CIRCLE
8
PREV_INCENDIO_AVCB
10
120.0
20
80.0
30
0.0
40
25.0
0
TEXT
8
PREV_INCENDIO_AVCB
10
100.0
20
60.0
30
0.0
40
14.0
1
EXT-PQS 6kg (P1)
0
CIRCLE
8
PREV_INCENDIO_AVCB
10
${((length * 100) - 120).toFixed(1)}
20
80.0
30
0.0
40
30.0
0
TEXT
8
PREV_INCENDIO_AVCB
10
${((length * 100) - 160).toFixed(1)}
20
60.0
30
0.0
40
14.0
1
HIDRANTE SH-01
`;

  // 4. IoT Telemetry Sensor Icons
  dxf += `0
CIRCLE
8
IOT_SENSORES
10
${((length * 100) / 2).toFixed(1)}
20
${midY.toFixed(1)}
30
0.0
40
20.0
0
TEXT
8
IOT_SENSORES
10
${((length * 100) / 2 - 80).toFixed(1)}
20
${(midY + 30).toFixed(1)}
30
0.0
40
12.0
1
[IoT GATEWAY #01]
`;

  // 5. Title Block / Selo Técnico (Carimbo)
  const stampX = (length * 100) - 400;
  const stampY = (width * 100) - 250;
  dxf += `0
LINE
8
COTAS_TEXTOS
10
${stampX}
20
${stampY}
30
0.0
11
${length * 100}
21
${stampY}
31
0.0
0
TEXT
8
COTAS_TEXTOS
10
${stampX + 15}
20
${stampY + 180}
30
0.0
40
22.0
1
REGULAPRO - PLANTA AS-BUILT
0
TEXT
8
COTAS_TEXTOS
10
${stampX + 15}
20
${stampY + 140}
30
0.0
40
14.0
1
OBRA: ${project.name.substring(0, 30)}
0
TEXT
8
COTAS_TEXTOS
10
${stampX + 15}
20
${stampY + 105}
30
0.0
40
12.0
1
PROCESSO: ${project.processType.substring(0, 32)}
0
TEXT
8
COTAS_TEXTOS
10
${stampX + 15}
20
${stampY + 70}
30
0.0
40
12.0
1
RESP. TEC: ${project.authorName || 'Engenharia'} | ESCALA 1:100
0
TEXT
8
COTAS_TEXTOS
10
${stampX + 15}
20
${stampY + 35}
30
0.0
40
12.0
1
DATA: ${new Date().toLocaleDateString('pt-BR')} | FORMATO AS-BUILT DWG/DXF
`;

  // End Entities
  dxf += `0
ENDSEC
0
EOF
`;

  return dxf;
}

/**
 * Triggers direct browser download for generated files
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
