// Novas expedições do Mato Grosso. Rotas rodoviárias: OSRM.
// Pontos de interesse: OpenStreetMap/Photon, consultados em 21/09/2026.
(function () {
  "use strict";

  const airport = Object.freeze({
    nome: "Aeroporto Internacional Marechal Rondon",
    lat: -15.6510677,
    lng: -56.120279
  });

  const nobresRoute = [[-56.120532,-15.651191],[-56.092566,-15.595991],[-56.057238,-15.471216],[-56.020187,-15.429891],[-56.030147,-15.375225],[-56.025569,-15.338168],[-56.010168,-15.3173],[-56.017174,-15.265845],[-55.993637,-15.173571],[-56.017646,-15.093166],[-55.931434,-15.030059],[-55.906127,-14.990829],[-55.854616,-14.939261],[-55.831225,-14.929395],[-55.787629,-14.876529],[-55.79807,-14.864159],[-55.797088,-14.815632],[-55.819483,-14.792646],[-55.827047,-14.756364],[-55.870134,-14.696252],[-55.884284,-14.650091],[-55.879478,-14.625364],[-55.913155,-14.578037],[-55.87285,-14.552828]];
  const caceresRoute = [[-56.120532,-15.651191],[-56.169704,-15.640185],[-56.265451,-15.679413],[-56.344209,-15.673321],[-56.405993,-15.702465],[-56.461317,-15.698086],[-56.610918,-15.779382],[-56.685291,-15.794484],[-56.79282,-15.848093],[-56.850212,-15.852166],[-56.929915,-15.936224],[-56.951813,-15.928665],[-57.09186,-15.943763],[-57.127762,-15.932772],[-57.265497,-16.046678],[-57.307432,-16.119857],[-57.351407,-16.150968],[-57.354292,-16.168245],[-57.385882,-16.202098],[-57.410922,-16.206518],[-57.458727,-16.253994],[-57.566503,-16.239398],[-57.577883,-16.19916],[-57.605447,-16.197437],[-57.61285,-16.158825],[-57.650563,-16.145195],[-57.68831,-16.090439],[-57.687832,-16.064223]];
  const altaFlorestaRoute = [[-56.120532,-15.651191],[-56.196414,-15.648624],[-56.495517,-15.231745],[-56.518504,-14.976016],[-56.429567,-14.820521],[-56.320075,-14.740412],[-56.229574,-14.531133],[-56.114904,-14.42989],[-56.153614,-14.274494],[-56.087348,-14.208273],[-56.118505,-14.103941],[-56.026049,-13.531311],[-56.090932,-13.386872],[-55.903717,-13.043857],[-55.824061,-12.83831],[-55.828727,-12.724297],[-55.513651,-12.160315],[-55.516432,-11.942482],[-55.473663,-11.778319],[-55.3881,-11.756309],[-55.445884,-11.671435],[-55.363629,-11.496818],[-55.309921,-11.119312],[-55.187369,-10.848938],[-55.277633,-10.785081],[-55.441949,-10.817252],[-55.535669,-10.582696],[-55.705767,-10.610124],[-55.805675,-10.258581],[-55.825387,-10.093955],[-55.788764,-9.97985],[-56.085742,-9.900917],[-56.083641,-9.870293]];

  window.PantanalNewExpeditions = Object.freeze({
    nobres: {
      nome: "Nobres — Bom Jardim",
      consultadoEm: "21/09/2026",
      origem: airport,
      destino: {
        nome: "Bom Jardim",
        lat: -14.5527154,
        lng: -55.8726449,
        descricao: "Base dos principais passeios de natureza da região de Nobres."
      },
      distanciaKm: 150.3,
      duracaoMinutos: 146,
      logistica: "Traslado rodoviário desde o Aeroporto Marechal Rondon.",
      rota: { type: "LineString", coordinates: nobresRoute },
      postos: [],
      atracoes: [
        { nome: "Reino Encantado", tipo: "Flutuação", descricao: "Flutuação em águas cristalinas com observação de peixes.", lat: -14.5900663, lng: -55.9614332 },
        { nome: "Cachoeira Serra Azul", tipo: "Cachoeira", descricao: "Cachoeira de águas claras em área natural.", lat: -14.495626, lng: -55.7052886 },
        { nome: "Lagoa das Araras", tipo: "Observação de aves", descricao: "Observação de aves, especialmente ao entardecer.", lat: -14.5622917, lng: -55.8706056 },
        { nome: "Rio Triste", tipo: "Flutuação", descricao: "Flutuação em águas cristalinas com observação de peixes.", lat: -14.6144297, lng: -55.7662449 },
        { nome: "Duto do Quebó", tipo: "Aventura", descricao: "Percurso aquático entre o rio e formações rochosas.", lat: -14.4423808, lng: -56.0150654 }
      ]
    },
    caceres: {
      nome: "Cáceres",
      consultadoEm: "21/09/2026",
      origem: airport,
      destino: {
        nome: "Cáceres",
        lat: -16.0644068,
        lng: -57.6878972,
        descricao: "Cidade histórica às margens do Rio Paraguai e porta de entrada do Pantanal Oeste."
      },
      distanciaKm: 214,
      duracaoMinutos: 208,
      logistica: "Traslado rodoviário desde o Aeroporto Marechal Rondon.",
      rota: { type: "LineString", coordinates: caceresRoute },
      postos: [],
      atracoes: [
        { nome: "Baía do Malheiros", tipo: "Rio e paisagem", descricao: "Área urbana junto ao Rio Paraguai para contemplação da paisagem.", lat: -16.0633694, lng: -57.6920431 },
        { nome: "Praça Barão do Rio Branco", tipo: "História", descricao: "Marco do centro histórico de Cáceres.", lat: -16.0644612, lng: -57.6877771 },
        { nome: "Catedral São Luiz de Cáceres", tipo: "História", descricao: "Patrimônio religioso no centro histórico da cidade.", lat: -16.0647753, lng: -57.6867971 },
        { nome: "Marco do Jauru", tipo: "História", descricao: "Monumento histórico ligado à formação da fronteira brasileira.", lat: -16.0646156, lng: -57.6872983 },
        { nome: "Museu Histórico de Cáceres", tipo: "Cultura", descricao: "Referência para conhecer a memória e a formação regional.", lat: -16.0665063, lng: -57.6853809 },
        { nome: "Dolina Água Milagrosa", tipo: "Natureza", descricao: "Dolina de águas profundas em propriedade com acesso controlado.", lat: -16.0427148, lng: -57.5276615 }
      ]
    },
    "alta-floresta": {
      nome: "Alta Floresta — Cristalino",
      consultadoEm: "21/09/2026",
      origem: airport,
      destino: {
        nome: "Alta Floresta",
        lat: -9.8698547,
        lng: -56.0834993,
        descricao: "Portal da Amazônia mato-grossense e base para experiências no Cristalino."
      },
      distanciaKm: 811.9,
      duracaoMinutos: 802,
      logistica: "Trecho longo por rodovia; traslado aéreo até Alta Floresta pode ser avaliado no orçamento.",
      rota: { type: "LineString", coordinates: altaFlorestaRoute },
      postos: [],
      atracoes: [
        { nome: "Cristalino Jungle Lodge", tipo: "Hospedagem e natureza", descricao: "Base privada para experiências de floresta e observação de fauna.", lat: -9.5976997, lng: -55.9312473 },
        { nome: "Parque Estadual Cristalino", tipo: "Parque estadual", descricao: "Área protegida de floresta amazônica e grande diversidade de aves.", lat: -9.5384698, lng: -55.9384955 },
        { nome: "Rio Cristalino", tipo: "Rio e paisagem", descricao: "Rio amazônico associado aos roteiros de natureza do Cristalino.", lat: -9.5374046, lng: -55.9045707 },
        { nome: "Parque dos Pioneiros", tipo: "Área verde urbana", descricao: "Área verde para caminhada e contato com a paisagem local.", lat: -9.8886938, lng: -56.0794487 },
        { nome: "Praça da Cultura", tipo: "Cultura", descricao: "Espaço urbano de convivência e referência cultural em Alta Floresta.", lat: -9.8682209, lng: -56.0829244 }
      ]
    }
  });
})();
