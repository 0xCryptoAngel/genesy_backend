import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Model } from 'mongoose';
import { Profile, ProfileDocument } from '../profile/profile.schema';
import { ProfileService } from '../profile/profile.service';
import { UpdateNftDto } from './nft.dto';
import { Nft, NftDocument } from './nft.schema';
import { CreateNftLogDto } from './nftLog.dto';
import { NftLog, NftLogDocument } from './nftLog.schema';

@Injectable()
export class NftService {
  constructor(
    @InjectModel(Nft.name)
    private readonly nftModel: Model<NftDocument>,
    @InjectModel(Profile.name)
    private readonly profileModel: Model<ProfileDocument>,
    @InjectModel(NftLog.name)
    private readonly nftLogModel: Model<NftLogDocument>,
    private readonly profileService: ProfileService,
  ) {}

  async findAll(): Promise<Nft[]> {
    return await this.nftModel.find().lean().exec();
  }
  async findItem(tokenId: number): Promise<any> {
    const nftItem: Nft & any = await this.nftModel
      .findOne({ tokenId })
      .lean()
      .exec();
    const [owner, artist] = await Promise.all([
      this.profileService.getProfile(nftItem.owner),
      this.profileService.getProfile(nftItem.artist),
    ]);

    return { ...nftItem, artistObj: artist, ownerObj: owner };
  }

  async getNftItemsByWallet(wallet: string): Promise<Nft[]> {
    return await this.nftModel.find({ artist: wallet }).lean().exec();
  }
  async getNftItemsByUser(wallet: string): Promise<Nft[]> {
    return await this.nftModel.find({ owner: wallet }).lean().exec();
  }

  async updateNftItem(tokenId: number, updateNftDto: UpdateNftDto) {
    const item = await this.nftModel.findOne({ tokenId }).exec();
    const artist = await this.profileModel
      .findOne({ wallet: item?.artist || updateNftDto.artist })
      .exec();
    await this.nftModel
      .findOneAndUpdate(
        { tokenId },
        { ...updateNftDto, curated: artist?.verified || false },
        {
          upsert: true,
        },
      )
      .exec();
  }
  async getMarketItems() {
    const [recentSales, topPrice, bestArtists] = await Promise.all([
      this.nftModel
        .find({ lastSoldAmount: { $gt: 0 } })
        .sort({ lastSoldAt: -1 })
        .limit(8)
        .lean()
        .exec(),
      this.nftModel
        .find({
          lastSoldAt: {
            $gte: new Date(new Date().getTime() - 3600 * 24 * 7 * 1000),
          },
        })
        .sort({ lastSoldAt: -1 })
        .limit(8)
        .lean()
        .exec(),
      this.profileModel
        .find({ artist: true })
        .sort({ totalVolume: -1 })
        .limit(8)
        .lean()
        .exec(),
    ]);
    return {
      recentSales,
      topPrice,
      bestArtists,
    };
  }

  async getPrimaryItems(
    order: string,
    page: number,
    pageSize: number,
    address: string,
  ) {
    const sort: any = {
      mintedAt: -1,
    };
    if (order == '1') {
      if (address) {
        const result = await this.profileModel.findOne({
          wallet: address,
        });
        return await this.nftModel
          .find({
            artist: { $in: result.friends },
            $expr: { $eq: ['$artist', '$owner'] },
            price: { $gt: 0 },
          })
          .sort(sort)
          .skip(page * pageSize)
          .limit(pageSize)
          .lean()
          .exec();
      } else {
        return await this.nftModel
          .find({ $expr: { $eq: ['$artist', '$owner'] }, price: { $gt: 0 } })
          .sort(sort)
          .skip(page * pageSize)
          .limit(pageSize)
          .lean()
          .exec();
      }
    } else {
      return await this.nftModel
        .find({ $expr: { $eq: ['$artist', '$owner'] }, price: { $gt: 0 } })
        .sort(sort)
        .skip(page * pageSize)
        .limit(pageSize)
        .lean()
        .exec();
    }
    // await this.nftModel.find({}).lean().exec();
  }

  async getPeersByArtistAndWallet(
    artist: string,
    wallet: string,
  ): Promise<any[]> {
    try {
      const profile = await this.profileModel.findOne({ wallet }).exec();
      const peers = await this.nftModel
        .find(
          { artist, owner: { $in: profile.friends } },
          {
            owner: 1,
            name: 1,
            description: 0,
            imageLink: 0,
            tokenId: 0,
            price: 0,
            royalty: 0,
            lastSoldAmount: 0,
            lastSoldAt: 0,
            mintedAt: 0,
            curated: 0,
          },
        )
        .select({
          owner: 1,
          name: 1,
          description: 0,
          imageLink: 0,
          tokenId: 0,
          price: 0,
          royalty: 0,
          lastSoldAmount: 0,
          lastSoldAt: 0,
          mintedAt: 0,
          curated: 0,
        })
        .lean()
        .exec();
      let peersWallet = peers.map((item) => ({
        owner: item.owner,
        name: item.name,
      }));
      const uniqueArray = (a) =>
        [...new Set(a.map((o) => JSON.stringify(o)))].map((s) =>
          JSON.parse(s as any),
        );
      peersWallet = uniqueArray(peersWallet);
      const profiles = await this.profileModel
        .find({ wallet: { $in: peersWallet.map((item) => item.owner) } })
        .select({
          wallet: 1,
          username: 1,
          avatarLink: 1,
        })
        .lean()
        .exec();

      return profiles;
    } catch (error) {
      return [];
    }
  }
  async getLogByTokenId(tokenId: number): Promise<NftLog[]> {
    return await this.nftLogModel.find({ tokenId }).lean().exec();
  }

  async createLogByTokenId(
    tokenId: number,
    createNftLogDto: CreateNftLogDto,
  ): Promise<NftLog> {
    const newLog = await this.nftLogModel.create({
      tokenId,
      timestamp: new Date(),
      ...createNftLogDto,
    });
    newLog.save();
    return newLog;
  }
}
