import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FiUpload } from 'react-icons/fi';
import './styles.css';

interface IProps {
	onFileUploaded: (file: File) => void;
}

const Dropzone: React.FC<IProps> = ({ onFileUploaded }) => {
	//Armazena o arquivo enviado
	const [selectedFileUrl, setSelectedFileUrl] = useState('');

	//Apos selecionar a imagem
	const onDrop = useCallback(
		acceptedFiles => {
			const file = acceptedFiles[0];
			const fileURL = URL.createObjectURL(file);
			setSelectedFileUrl(fileURL);
			onFileUploaded(file);
		},
		[onFileUploaded],
	);

	//Config do componente
	const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: 'image/*' });

	//No render, caso tenha selecionado a imagem, mostro a imagem, caso não, ainda verifico se o user esta ou não com
	//algo no drag para soltar, ai mostra um texto diferente.
	return (
		<div className="dropzone" {...getRootProps()}>
			<input {...getInputProps()} accept="image/*" />
			{selectedFileUrl ? (
				<img src={selectedFileUrl} alt="Point" />
			) : isDragActive ? (
				<p>Arraste os arquivos aqui ...</p>
			) : (
				<p>
					<FiUpload />
					Arraste ou clique para carregar arquivos
				</p>
			)}
		</div>
	);
};

export default Dropzone;
