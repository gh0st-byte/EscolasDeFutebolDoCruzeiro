from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time
import json

# lista com todos os 55 endereços
enderecos = [
    "Rua Edgard Ramos Barroso, 149 – Jd Paulista – Arinos – MG Cep.: 38.680-000",
    "Av Barão de Guaxupé 775, Bairro Alto dos Pinheiros, BH 30530-160",
    "Clube Social do Cruzeiro situado à Rua dos Guajajaras,1722 – Barro Preto – BH – CEP: 30180-101",
    "Clube Social do Cruzeiro situado à Rua das Canárias, 254 – Santa Branca – Região Pampulha – Cep: 31560-050",
    "Rua Castelo de Setúbal, 348, Castelo, Belo Horizonte-MG",
    "Rua João Chagas, 457 – União CEP: 31170-370",
    "QNM 13 – CEM 03 – GRAMADO SINTÉTICO – CEP: 72215-130",
    "Rua Siriema, nº 115 – Laranjeiras – CEP: 05208-030 – Caieiras/SP",
    "R. Ver. Otacílio Paiva Filho, 20 – Camanducaia, MG, 37650-000",
    "R. Aquiles Guimarães, 209 – Carmo do Cajuru, MG, 35557-000",
    "Av. Michel Pereira de Souza n° 1105 – Congonhas – MG CEP: 36417-050",
    "Rua Santa Maria, n. 177, bairro Carijós, Conselheiro Lafaiete/MG, CEP: 36.406-098",
    "Rua Wilson Gramiscelli, 240 – Bairro Arvoredo – Contagem/MG – CEP: 32113-300",
    "Rua Beta, 125 – Jardim Riacho das Pedras CEP: 32.241-240",
    "Calle 163 #62-71 Torre 1 AP 404, Bogotá, Colombia",
    "No.0133-02-018262, based in 6-6-2 Honkomagome, Bunkyo-ku Tokyo",
    "Calle Miguel Angel 483. Distrito de San Borja. Provincia de Lima, Perú",
    "Praputt Kamlang-ek Football Club Co., Ltd. (Head Office) – Legal address 17/1 Soi Pridi Bhanomyong 21 (Chuleeporn), Sukhumvit 71 Rd., Phrakhanong Nue, Wattana, Bangkok",
    "155 Webster St, Hanover MA 02339, Boston, USA",
    "371 Devon Street #2 – Kearny, New Jersey – 07032-2611",
    "Rua Julio Nogueira, 1511 – Bairro Catalão – CEP: 35501-207",
    "Rua Clóvis Amaral, 321 – Liberdade, 35502-638",
    "Rua Bernardo Manuel, n° 11361, Bairro Mondubim, Fortaleza/CE",
    "Rua João Napoleão da Cruz, 255, Centro, Ipatinga-MG CEP 35160-027",
    "Rua Airton Gonçalves, 381 – Doze de Março – Itabira – MG CEP: 35903-000",
    "Avenida Queiroz Júnior, n. 659, bairro Centro, em Itabirito/MG, CEP 35.450-069",
    "Rua Ivan de Azevedo, 04 Centro – Engenheiro Pedreira/ Japeri – CEP:26453-023",
    "Rua Realeza 70 Novo Horizontino – João Monlevade – 35930-080",
    "Avenida Barão do Rio Branco, 4400 Bairro Passos – CEP: 36026 500",
    "Rua Santo Antônio do Monte, S/N, Bairro São Geraldo, Lagoa Santa – MG, 33400-000",
    "Rua São Mateus, 03 – Bairro Todos os Santos – CEP: 39400-139",
    "Rua Silvio Romero de Aguiar, 988, Major Prates, Montes Claros-MG, CEP: 39.403-216",
    "Avenida João Teixeira, n. 62, bairro Morada da Chácara, em Mutum/MG, CEP: 36.955-000",
    "Rua Augusto Gomes da Silva Sobrinho, n. 143, bairro Itaipu, Niterói/RJ, CEP 24.344-160",
    "Rodovia Januario Carneiro 644, Ouro Velho Mansões, Nova Lima – MG 34004-706",
    "Av. Norte Sul, nº 731 – Nova Serrana/MG, CEP: 35525-100",
    "Rua Levi José da Silva, nº 325 – Bairro Recanto da Serra – Pará de Minas/MG – CEP: 35661-098",
    "Rua São Vicente, n°159 – Bairro Centro – CEP: 38.600-232",
    "Avenida José Maria de Alkmim, 632, bairro Centro, Patrocínio/MG, CEP 38.740-068",
    "Rua Arthur Raubach, 241, Sítio Floresta, Pelotas-RS CEP 96070-510",
    "Rua Arthur Raubach, 241 – Bairro Sítio Floresta 96070-510",
    "Rua Jacob Bainy, 281 – Bairro Três Vendas 96065-580",
    "Rua Benjamim Constant, n° 295 – Bairro Centro – Porteirinha/MG – CEP: 39.520-000",
    "Avenida Ribeirão das Neves, nº 889 – Bairro Sevilha – Ribeirão das Neves/MG",
    "Rua José Brochado, s/n, Bandeirantes, Sabará-MG CEP 34525-020",
    "BR 262, nª 7000, Nações Unidas, Sabará-MG CEP 86066-000",
    "Avenida Professor Djalma Guimarães, 2313A – Chácara Santa Inês (São Benedito) – Santa Luzia – MG – 33170-010",
    "R. Couto Magalhães, 310B – Aeroporto Velho, Santarém – PA, 68020-010",
    "Sítio Recanto, SN, Zona Rural, São Joaquim da Barra/SP, CEP 14.600-000",
    "Rua Sessenta e Sete, 24 – Conj. Hab. Vinhais, São Luis – MA, CEP 65074-525",
    "Estrada do Engenho Seco, n°300, Condomínio Malongo – Sarzedo/MG – CEP: 32450-000",
    "Rua Hélio Ottoni, s/n, São Diego, Teófilo Otoni-MG CEP 39803-006",
    "Rua da Aldeia, nº 214, Centro – Unaí/MG – CEP: 38.610-024",
    "Rua Paraisopolis, 359 Vila Cristina – Betim – MG 32675-456",
    "Rua Netuno, s/n, Alvorada, Vila Velha-ES CEP 29117-270"
]


geolocator = Nominatim(user_agent="escolas_cruzeiro")

schools = []

for e in enderecos:
    try:
        loc = geolocator.geocode(e, timeout=10)
        if loc:
            schools.append({
                "lat": loc.latitude,
                "lng": loc.longitude,
                "nome": e,
                "region": "brasil"
            })
            print(f"OK: {e} -> {loc.latitude}, {loc.longitude}")
        else:
            print(f"Não encontrado: {e}")
    except GeocoderTimedOut:
        print(f"Timeout: {e}")
    time.sleep(1)  # respeitar limite da API gratuita

# salva no arquivo
with open("./json/schools.json", "w", encoding="utf-8") as f:
    json.dump(schools, f, ensure_ascii=False, indent=4)

print("Finalizado. Dados salvos em schools.json")
