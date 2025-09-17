import requests
import time
import json
import re

def clean_address(address):
    """Limpa e padroniza o endereço"""
    # Remove caracteres especiais e padroniza
    address = re.sub(r'–|—', '-', address)
    address = re.sub(r'n°|nº', 'n', address)
    address = re.sub(r'CEP:?\s*', '', address)
    address = re.sub(r'\s+', ' ', address)
    return address.strip()

def get_coordinates_nominatim(address, country_code='br'):
    """Busca coordenadas usando OpenStreetMap Nominatim"""
    url = "https://nominatim.openstreetmap.org/search"
    
    # Diferentes variações para tentar
    variations = [
        address + f", Brasil" if country_code == 'br' else address,
        clean_address(address) + f", Brasil" if country_code == 'br' else clean_address(address),
    ]
    
    # Se for endereço brasileiro, adiciona mais variações
    if country_code == 'br':
        # Extrai cidade e estado se possível
        if 'MG' in address or 'Minas Gerais' in address:
            city_match = re.search(r'([A-Za-z\s]+)\s*[-–]\s*MG', address)
            if city_match:
                city = city_match.group(1).strip()
                variations.append(f"{city}, Minas Gerais, Brasil")
        
        # Outras tentativas para estados específicos
        state_mappings = {
            'RJ': 'Rio de Janeiro', 'SP': 'São Paulo', 'CE': 'Ceará',
            'MA': 'Maranhão', 'RS': 'Rio Grande do Sul', 'PA': 'Pará',
            'ES': 'Espírito Santo', 'DF': 'Distrito Federal'
        }
        
        for abbr, full_name in state_mappings.items():
            if abbr in address:
                city_match = re.search(r'([A-Za-z\s]+)\s*[-–]\s*' + abbr, address)
                if city_match:
                    city = city_match.group(1).strip()
                    variations.append(f"{city}, {full_name}, Brasil")
    
    headers = {
        'User-Agent': 'EscolasCruzeiro/1.0 (escolas@cruzeiro.com.br)'
    }
    
    for variation in variations:
        params = {
            'q': variation,
            'format': 'json',
            'countrycodes': country_code,
            'limit': 1,
            'addressdetails': 1
        }
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data and len(data) > 0:
                    result = data[0]
                    return float(result['lat']), float(result['lon']), result.get('display_name', variation)
            time.sleep(0.5)  # Pequena pausa entre tentativas
        except Exception as e:
            print(f"Erro na variação '{variation}': {e}")
            continue
    
    return None, None, None

def determine_country_code(address):
    """Determina o código do país baseado no endereço"""
    if any(country in address.lower() for country in ['colombia', 'bogotá']):
        return 'co'
    elif any(country in address.lower() for country in ['japan', 'tokyo', 'bunkyo']):
        return 'jp'
    elif any(country in address.lower() for country in ['peru', 'lima']):
        return 'pe'
    elif any(country in address.lower() for country in ['thailand', 'bangkok']):
        return 'th'
    elif any(country in address.lower() for country in ['usa', 'boston', 'hanover', 'new jersey', 'kearny']):
        return 'us'
    else:
        return 'br'

# Lista com todos os endereços
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

schools = []
failed_addresses = []

print(f"Iniciando busca de coordenadas para {len(enderecos)} endereços...")
print("=" * 80)

for i, endereco in enumerate(enderecos, 1):
    print(f"\n[{i}/{len(enderecos)}] Processando: {endereco[:60]}...")
    
    country_code = determine_country_code(endereco)
    
    try:
        lat, lng, display_name = get_coordinates_nominatim(endereco, country_code)
        
        if lat and lng:
            schools.append({
                "lat": lat,
                "lng": lng,
                "nome": endereco,
                "endereco_encontrado": display_name,
                "region": "brasil" if country_code == 'br' else country_code
            })
            print(f"✅ SUCESSO: {lat:.6f}, {lng:.6f}")
            print(f"   Encontrado: {display_name}")
        else:
            failed_addresses.append(endereco)
            print(f"❌ NÃO ENCONTRADO")
            
    except Exception as e:
        failed_addresses.append(endereco)
        print(f"❌ ERRO: {e}")
    
    # Pausa para respeitar rate limit (1 request por segundo)
    time.sleep(1.2)

# Salva resultados
try:
    with open("./Json/addressSchools.json", "w", encoding="utf-8") as f:
        json.dump(schools, f, ensure_ascii=False, indent=4)
    print(f"\n✅ Dados salvos em addressSchools.json")
except:
    # Se não conseguir salvar na pasta Json, salva na pasta atual
    with open("addressSchools.json", "w", encoding="utf-8") as f:
        json.dump(schools, f, ensure_ascii=False, indent=4)
    print(f"\n✅ Dados salvos em addressSchools.json (pasta atual)")

# Salva endereços que falharam para reprocessamento manual
if failed_addresses:
    try:
        with open("./Json/failed_addresses.json", "w", encoding="utf-8") as f:
            json.dump(failed_addresses, f, ensure_ascii=False, indent=4)
    except:
        with open("failed_addresses.json", "w", encoding="utf-8") as f:
            json.dump(failed_addresses, f, ensure_ascii=False, indent=4)

# Estatísticas finais
print("\n" + "=" * 80)
print("📊 ESTATÍSTICAS FINAIS:")
print(f"✅ Sucessos: {len(schools)}")
print(f"❌ Falhas: {len(failed_addresses)}")
print(f"📈 Taxa de sucesso: {len(schools)/len(enderecos)*100:.1f}%")

if failed_addresses:
    print(f"\n❌ Endereços que falharam:")
    for addr in failed_addresses:
        print(f"   - {addr}")
    print(f"\n💡 Dica: Verifique o arquivo 'failed_addresses.json' para reprocessar manualmente")

print("\n🎉 Finalizado!")
