/**
 * Mapeamento de sprites por definitionId de loja.
 * Cada tipo de loja tem seu próprio sprite isométrico.
 */

import lojaMerceariaImg from '@/assets/loja_mercearia.png';
import lojaPadariaImg from '@/assets/loja_padaria.png';
import lojaAcougueImg from '@/assets/loja_acougue.png';
import lojaFarmaciaImg from '@/assets/loja_farmacia.png';
import lojaPostoImg from '@/assets/loja_posto.png';
import lojaRestauranteImg from '@/assets/loja_restaurante.png';
import lojaRoupaImg from '@/assets/loja_roupa.png';
import lojaAcademiaImg from '@/assets/loja_academia.png';
import lojaHotelImg from '@/assets/loja_hotel.png';
import lojaTechImg from '@/assets/loja_tech.png';
import lojaShoppingImg from '@/assets/loja_shopping.png';
import lojaHoldingImg from '@/assets/loja_holding.png';
import lojaVermelhaImg from '@/assets/loja_vermelha.png';

/** Mapa de definitionId → caminho da imagem do sprite */
export const STORE_SPRITE_MAP: Record<string, string> = {
  mercearia: lojaMerceariaImg,
  padaria: lojaPadariaImg,
  acougue: lojaAcougueImg,
  farmacia: lojaFarmaciaImg,
  posto: lojaPostoImg,
  restaurante: lojaRestauranteImg,
  'loja-roupa': lojaRoupaImg,
  academia: lojaAcademiaImg,
  hotel: lojaHotelImg,
  'tech-startup': lojaTechImg,
  shopping: lojaShoppingImg,
  holding: lojaHoldingImg,
};

/** Sprite padrão (fallback) caso o definitionId não tenha sprite específico */
export const DEFAULT_STORE_SPRITE = lojaVermelhaImg;

/**
 * Retorna o caminho do sprite para uma loja dado seu definitionId.
 */
export function getStoreSpriteUrl(definitionId: string): string {
  return STORE_SPRITE_MAP[definitionId] ?? DEFAULT_STORE_SPRITE;
}
