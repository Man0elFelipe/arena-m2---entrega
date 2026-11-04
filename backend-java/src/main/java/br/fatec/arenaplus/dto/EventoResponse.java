package br.fatec.arenaplus.dto;
import br.fatec.arenaplus.entity.Evento;
import java.time.LocalDateTime;
public record EventoResponse(Long id,String modalidade,String titulo,String descricao,String cidade,String local,LocalDateTime dataHora,int vagasMaximas,long participantes,Long organizadorId,String organizador,String estado,boolean participando){public static EventoResponse from(Evento e,long n,Long eu,boolean mine){return new EventoResponse(e.getId(),e.getModalidade(),e.getTitulo(),e.getDescricao(),e.getCidade(),e.getLocal(),e.getDataHora(),e.getVagasMaximas(),n,e.getOrganizador().getId(),e.getOrganizador().getNome(),e.getEstado().name(),mine);}}
