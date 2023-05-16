import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { UpdateNftDto } from './nft.dto';
import { NftService } from './nft.service';
import { CreateNftLogDto } from './nftLog.dto';

@Controller('nfts')
export class NftController {
  constructor(private readonly service: NftService) {}

  @Get()
  async index() {
    return await this.service.findAll();
  }

  @Get('market')
  async getMarketItems() {
    return await this.service.getMarketItems();
  }

  @Get(':tokenId')
  async getNftItem(@Param('tokenId') tokenId: number) {
    return await this.service.findItem(tokenId);
  }
  @Put(':tokenId')
  @ApiOperation({ description: 'https://prnt.sc/qmyW4JdZ8Txt' })
  async updateNftItem(
    @Param('tokenId') tokenId: number,
    @Body() updateNftDto: UpdateNftDto,
  ) {
    return await this.service.updateNftItem(tokenId, updateNftDto);
  }

  @Get('artist/:wallet')
  async getNftItemsByWallet(@Param('wallet') wallet: string) {
    return await this.service.getNftItemsByWallet(wallet);
  }
  @Get('user/:wallet')
  async getNftItemsByUser(@Param('wallet') wallet: string) {
    return await this.service.getNftItemsByUser(wallet);
  }
  @Get('primary/:order/:page/:pageSize')
  async getPrimaryItems(
    @Param('order') order: string,
    @Param('page') page: number,
    @Param('pageSize') pageSize: number,
    @Query('address') address: string,
  ) {
    return await this.service.getPrimaryItems(order, page, pageSize, address);
  }

  @Get('peers/:artist/:wallet')
  async getPeersByArtistAndWallet(
    @Param('artist') artist: string,
    @Param('wallet') wallet: string,
  ) {
    return await this.service.getPeersByArtistAndWallet(artist, wallet);
  }
  @Get('log/:tokenId')
  async getLogByTokenId(@Param('tokenId') tokenId: number) {
    return await this.service.getLogByTokenId(tokenId);
  }
  @Post('log/:tokenId')
  async createLogByTokenId(
    @Param('tokenId') tokenId: number,
    @Body() createNftLogDto: CreateNftLogDto,
  ) {
    return await this.service.createLogByTokenId(tokenId, createNftLogDto);
  }
}
