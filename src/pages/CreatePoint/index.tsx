import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { Link, useHistory } from 'react-router-dom';
import { Map, TileLayer, Marker } from 'react-leaflet';
import { LeafletMouseEvent } from 'leaflet';
import axios from 'axios';
import './styles.css';

import Dropzone from '../../components/Dropzone';
import api from '../../services/api';
import logo from '../../assets/logo.svg';

//==============================
// INTERFACES
//==============================
interface ItemInterface {
	id: number;
	title: string;
	image_url: string;
}

interface IBGEUfResponse {
	sigla: string;
}

interface IBGECityResponse {
	nome: string;
}

const CreatePoint: React.FC = () => {
	//==============================
	// ESTADO
	//==============================
	const [items, setItems] = useState<ItemInterface[]>([]);
	const [ufs, setUfs] = useState<string[]>([]);
	const [cities, setCities] = useState<string[]>([]);
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		whatsapp: '',
	});

	const [selectedUfs, setSelectedUf] = useState<string>('0');
	const [selectedCity, setSelectedCity] = useState<string>('0');
	const [selectedItems, setSelectedItems] = useState<number[]>([]);
	const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0]);
	const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0]);
	const [selectedFile, setSelectedFile] = useState<File>();

	//==============================
	// VARIAVEIS DE USO DE ESTADO
	//==============================
	//Cria uma variavel que permite forçar a navegação sem algum evento
	const history = useHistory();

	//==============================
	// USE EFFECT
	//==============================
	// Busca os items de coleta
	useEffect(() => {
		api.get('items').then(response => {
			setItems(response.data);
		});
	}, []);

	// Busca os dados iniciais de posição do mapa
	useEffect(() => {
		navigator.geolocation.getCurrentPosition(
			position => {
				const { latitude, longitude } = position.coords;
				setInitialPosition([latitude, longitude]);
			},
			error => {
				setInitialPosition([-22.124381, -51.3784825]);
			},
		);
	}, []);

	//Busca as UF
	useEffect(() => {
		axios.get<IBGEUfResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
			const ufSiglas = response.data.map(uf => uf.sigla);
			setUfs(ufSiglas);
		});
	}, []);

	//Busca as cidades baseado no UF
	useEffect(() => {
		axios
			.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUfs}/municipios`)
			.then(response => {
				const cities = response.data.map(city => city.nome);
				setCities(cities);
			});
	}, [selectedUfs]);

	//==============================
	// EVENTOS
	//==============================
	//Muda o UF selecionado
	function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
		const uf = event.target.value;
		setSelectedUf(uf);
	}

	//Muda a Cidade selecionada
	function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
		const city = event.target.value;
		setSelectedCity(city);
	}

	//Clik do mouse
	function handleMapClick(event: LeafletMouseEvent) {
		setSelectedPosition([event.latlng.lat, event.latlng.lng]);
	}

	//Captura dados digitados dos inputs
	function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
		const { name, value } = event.target;
		setFormData({ ...formData, [name]: value });
	}

	//Evento para selecionar/des-selecionar os items
	function handleSelectItem(id: number) {
		//Verifica se o item clicado já estava selecionado
		const itemJaSelecionado = selectedItems.findIndex(item => item === id);
		if (itemJaSelecionado >= 0) {
			//Caso já exista o item, retorna uma nova lista sem o item
			const itemsSemItemClicado = selectedItems.filter(item => item !== id);
			//Adiciona o array
			setSelectedItems(itemsSemItemClicado);
		} else {
			//Caso o item não estava selecionado, adiciona o que tinha antes + o item
			setSelectedItems([...selectedItems, id]);
		}
	}

	//Evento para Gravar o Ponto
	async function handleSubmit(event: FormEvent) {
		event.preventDefault();

		const { name, email, whatsapp } = formData;
		const uf = selectedUfs;
		const city = selectedCity;
		const [latitude, longitude] = selectedPosition;
		const items = selectedItems;

		//Utilizando formData por conta do envio do arquivo
		const data = new FormData();

		data.append('name', name);
		data.append('email', email);
		data.append('whatsapp', whatsapp);
		data.append('uf', uf);
		data.append('city', city);
		data.append('latitude', String(latitude));
		data.append('longitude', String(longitude));
		data.append('items', items.join(','));

		if (selectedFile) {
			data.append('image', selectedFile);
		}

		await api.post('points', data);

		alert('Ponto de coleta criado!');

		history.push('/');
	}

	//==============================
	// RENDER
	//==============================
	return (
		<div id="page-create-point">
			<header>
				<img src={logo} alt="Ecoleta" />

				<Link to="/">
					<FiArrowLeft />
					Voltar para Home
				</Link>
			</header>

			<form onSubmit={handleSubmit}>
				<h1>
					Cadastro do <br /> ponto de coleta
				</h1>

				<Dropzone onFileUploaded={setSelectedFile} />

				<fieldset>
					<legend>
						<h2>Dados</h2>
					</legend>

					<div className="field">
						<label htmlFor="name">E-mail</label>
						<input type="text" name="name" id="name" onChange={handleInputChange} />
					</div>

					<div className="field-group">
						<div className="field">
							<label htmlFor="email">E-mail</label>
							<input type="email" name="email" id="email" onChange={handleInputChange} />
						</div>

						<div className="field">
							<label htmlFor="whatsapp">Whatsapp</label>
							<input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Endereço</h2>
						<span>Selecione o endereço no mapa</span>
					</legend>

					<Map center={initialPosition} zoom={15} onClick={handleMapClick}>
						<TileLayer
							attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						<Marker position={selectedPosition} />
					</Map>

					<div className="field-group">
						<div className="field">
							<label htmlFor="uf">Estado (uf)</label>
							<select name="uf" id="uf" onChange={handleSelectUf} value={selectedUfs}>
								<option value="0">Selecione um estado(UF)</option>
								{ufs.map(uf => (
									<option key={uf} value={uf}>
										{uf}
									</option>
								))}
							</select>
						</div>
						<div className="field">
							<label htmlFor="city">Cidade</label>
							<select name="city" id="city" onChange={handleSelectCity} value={selectedCity}>
								<option value="0">Selecione uma cidade</option>
								{cities.map(city => (
									<option key={city} value={city}>
										{city}
									</option>
								))}
							</select>
						</div>
					</div>
				</fieldset>

				<fieldset>
					<legend>
						<h2>Itens de Coleta</h2>
						<span>Selecione os itens abaixo</span>
					</legend>

					<ul className="items-grid">
						{/* {items.map(item => (
							<li
								key={item.id}
								onClick={() => handleSelectItem(item.id)}
								className={selectedItems.includes(item.id) ? 'selected' : ''}
							>
								<img src={item.image_url} alt={item.title} />
								<span>{item.title}</span>
							</li>
						))} */}

						{/* Reparar nesse detalhe, ao fazer o MAP com o {} precisa do return() porem permite fazer outras
                        coisas, usar dessa forma caso precise, ou usar como está acima colocando o () apos o => ai não
                        precisa do return */}
						{items.map(item => {
							// console.log('Fazer outra coisa');
							return (
								<li
									key={item.id}
									onClick={() => handleSelectItem(item.id)}
									className={selectedItems.includes(item.id) ? 'selected' : ''}
								>
									<img src={item.image_url} alt={item.title} />
									<span>{item.title}</span>
								</li>
							);
						})}
					</ul>
				</fieldset>

				<button type="submit">Cadastrar ponto de coleta</button>
			</form>
		</div>
	);
};

export default CreatePoint;
